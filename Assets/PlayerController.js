#pragma strict

public var speed : float = 0.5f;
public var loopSprites : SpriteManager[];
public var jumpSprite : JumpSpriteManager;
public var layerMask : LayerMask;
public var doorOpenTexture : Texture2D;
public var doorCloseTexture : Texture2D;
public var normalTexture : Texture2D;
public var rollOverTexture : Texture2D;
public var clickSound : AudioClip;
public var key : GameObject;
public var player : GameObject;
public var restartBotton : GameObject;
public var getKeySound : AudioClip;
public var doorOpensSound : AudioClip;
public var jumpSound : AudioClip;
private var hasKey : boolean;
private var inDirection : int;
private var isJumping : boolean;
private var fHeigth : float;
private var fLastY : float;
private var mesh : Mesh;
private var restartButton : GUITexture;

class SpriteManager{
	public var textureUsed : Texture2D;
	public var framesPerSec : int;
	public var intImgX : int;
	public var intImgY : int;
	
	private var fPercentTime : float;
	private var fNextTime : float;
	private var fImgX : float;
	private var fImgY :float;
	private var curFrame : int;
	
	public function init() : void{
		fPercentTime = 1.0/framesPerSec;
		fNextTime = fPercentTime;
		fImgX = 1.0/intImgX;
		fImgY = 1.0/intImgY;
		curFrame = 1;
	}
	
	public function updateAnimation(direction :int, material : Material) : void {
		var intCol : int = 0;
		material.mainTexture = textureUsed;
		if(Time.time > fNextTime){
			fNextTime = Time.time + fPercentTime;
			curFrame++;
			if(curFrame > framesPerSec){
				curFrame = 1;
			}
		}
		material.mainTextureScale = new Vector2(direction*fImgX, fImgY);
		if(intImgY > 1){
			intCol = Mathf.Ceil(curFrame/intImgX);
		}
		if(direction == 1){
			material.mainTextureOffset = new Vector2((curFrame%intImgX)*fImgX, intCol*fImgY);
		}else{
			material.mainTextureOffset = new Vector2(((intImgX + (curFrame)%intImgX)) * fImgX, intCol*fImgY);
		}
	}
	
	public function resetFrame() : void{
		curFrame = 1;
	}
}

class JumpSpriteManager {
	public var jumpStartTexture : Texture2D; 
	public var jumpAirTexture : Texture2D; //Alternative Jump

	public var jumpDownTexture : Texture2D;
	public function updateJumpAnimation (_direction : int, _velocityY : float, _material : Material) : void {
	//Checking for the player position in the air
	if ((_velocityY>= -3.0) && (_velocityY<= 3.0)) { 
		_material.mainTexture = jumpAirTexture;
	} else if (_velocityY> 2.0) { //Start Jump
		_material.mainTexture =  jumpStartTexture;
	} else { //Fall
		_material.mainTexture = jumpDownTexture;
	}
	_material.mainTextureScale = new Vector2 (_direction * 1, 1);
	_material.mainTextureOffset = new Vector2 (_direction * 1, 1);
	}
}
	
function Start () {
	inDirection = 1;
	restartButton = GameObject.FindWithTag("RestartButton").guiTexture;
	restartButton.enabled = false;
	for(var i : int = 0; i < loopSprites.length; i++){
		loopSprites[i].init();
	}
	Camera.main.transform.position = new Vector3 (transform.position.x,
	transform.position.y, Camera.main.transform.position.z);
	mesh = GetComponent(MeshFilter).sharedMesh;
	fHeigth = mesh.bounds.size.y * transform.localScale.y;
	fLastY = transform.position.y;
	isJumping = false;
	hasKey = false;
}

function Update () {
	if(!isJumping){
		if(Input.GetButton("Horizontal")){
			inDirection = Input.GetAxis("Horizontal") < 0 ? -1 : 1;
			rigidbody.velocity = new Vector3 ((inDirection*speed), rigidbody.velocity.y, 0);
			loopSprites[0].resetFrame();
			loopSprites[1].updateAnimation(inDirection, renderer.material);
		}else{
			loopSprites[1].resetFrame();
			loopSprites[0].updateAnimation(inDirection, renderer.material);
		}
		if(Input.GetButton("Jump")){
			isJumping = true;
			audio.volume = 0.3;
			audio.PlayOneShot(jumpSound);
			loopSprites[0].resetFrame();
			loopSprites[1].resetFrame();
			rigidbody.velocity = new Vector3 (rigidbody.velocity.x, -Physics.gravity.y, 0);
		}
		}else{
			jumpSprite.updateJumpAnimation(inDirection, rigidbody.velocity.y, renderer.material);
		}
	}


function LateUpdate(){
	var hit : RaycastHit;
	var v3_hit : Vector3 = transform.TransformDirection (-Vector3.up) * (fHeigth * 0.5);
	var v3_right : Vector3 = new Vector3(transform.position.x + (collider.bounds.size.x*0.45), transform.position.y, transform.position.z);
	var v3_left : Vector3 = new Vector3(transform.position.x -(collider.bounds.size.x*0.45), transform.position.y, transform.position.z);
	
	if (Physics.Raycast (transform.position, v3_hit, hit, 2.5, layerMask.value)) {
		isJumping = false;
	} else if (Physics.Raycast (v3_right, v3_hit, hit, 2.5, layerMask.value)) {
		if (isJumping) {
			isJumping = false;
		}
	} else if (Physics.Raycast (v3_left, v3_hit, hit, 2.5, layerMask.value)) {
		if (isJumping) {
			isJumping = false;
		}
	} else {
		if (!isJumping) {
			if (Mathf.Floor(transform.position.y) == fLastY) {
				isJumping = false;
		} else {
				isJumping = true;
			}
		}
	}
	fLastY = Mathf.Floor(transform.position.y);
	Camera.main.transform.position = new Vector3(transform.position.x, transform.position.y, Camera.main.transform.position.z);
}

public function OnTriggerEnter (hit : Collider) : IEnumerator {
	if(hit.collider.tag == "Key"){
		audio.volume = 1.0;
		audio.PlayOneShot(getKeySound);
		hasKey = true;
		Destroy(hit.gameObject);
	}
	
	if(hit.collider.tag == "Door"){
		if (hasKey){
			audio.volume = 1.0;
			audio.PlayOneShot(doorOpensSound);
			hit.gameObject.renderer.material.mainTexture = doorOpenTexture;
			yield WaitForSeconds(1);
			Destroy(gameObject);
			hit.gameObject.renderer.material.mainTexture = doorCloseTexture;
			restartButton.enabled = true;
		}
	}
}

public function OnMouseEnter() : void {
	guiTexture.texture = rollOverTexture;
}

public function onMouseExit() : void {
	guiTexture.texture = normalTexture;
}

public function onMouseUp () : IEnumerator {
	audio.PlayOneShot(clickSound);
	yield new WaitForSeconds(1.0);
	Instantiate(player, new Vector3(player.transform.position.x, player.transform.position.y, 0.0), player.transform.rotation);
	Instantiate(key, new Vector3(key.transform.position.x, key.transform.position.y, 0.0), key.transform.rotation);
	guiTexture.enabled = false;
}

@script RequireComponent(AudioSource)