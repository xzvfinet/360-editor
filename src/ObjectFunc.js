var sceneEl = document.querySelector('a-scene');
var totalEntities = new Array();

var transform = {
    position: { x: 0, y: 2, z: -3 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
}

function ObjButtonDown(primitive) {
    //var geometry = { height: 1, width: 1, depth: 1 }
    var material = { color: 'red' };
    CreateObject(primitive, transform, material);
}
function ImgButtonDown(){
    var material = { src:'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQimF5gsnL4G5ryB61f1yklONy9TZznLzB4WiNUlCQJErin0xEj'};
    CreateImage(transform, 2, 2, material);
}
function TextButtonDown(){
    var material = { color: 'green' };
    CreateText(transform,20,material,"helloBye",null);
}
function SkyButtonDown(){
    var material = {src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRympK-JR0fqVYXJuS6eN-ASz-bkr9ZcyF2ySJOFCsDI3sMyPYcU2BWcxQ'};
    CreateSky(material);
}
function GetPrimitive(){
    var entityEl = document.querySelector('a-image');
    console.log(entityEl.getAttribute('geometry').primitive);
}

//2D,3D오브젝트 삽입
function CreateObject(primitive, transform, material) {
    var entityEl = document.createElement('a-'+primitive);
    sceneEl.appendChild(entityEl);

    var id = AssignId(primitive);
    entityEl.setAttribute('id',id);
    entityEl.setAttribute('geometry', {
        primitive: primitive
    });
    entityEl.setAttribute('position', { x: transform.position.x, y: transform.position.y, z: transform.position.z });
    entityEl.setAttribute('rotation', { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z });
    entityEl.setAttribute('scale', { x: transform.scale.x, y: transform.scale.y, z: transform.scale.z });
    entityEl.setAttribute('material', 'color', material['color']);

    entityEl.addEventListener('click', function (evt) {
        console.log(id+"clicked");
        PrintTransform(id);
    });
    //entityEl.setAttribute('material', 'src', material['src']);
}
//오브젝트의 Transform반환
function GetTransform(id){
    var entityEl = document.getElementById(id);

    var transform = {
        position: { x: entityEl.getAttribute('position').x, y: entityEl.getAttribute('position').y, z: entityEl.getAttribute('position').z},
        rotation: { x: entityEl.getAttribute('rotation').x, y: entityEl.getAttribute('rotation').y, z: entityEl.getAttribute('rotation').z },
        scale: { x: entityEl.getAttribute('scale').x, y: entityEl.getAttribute('scale').y, z: entityEl.getAttribute('scale').z }
    }
    //document.getElementById('test').innerText = transform.position.x + transform.position.y + transform.position.z;
    return transform;
}
//오브젝트의 Transform 수정
function UpdateObject(id,transform){
    var entityEl = document.getElementById(id);

    entityEl.setAttribute('position', { x: transform.position.x, y: transform.position.y, z: transform.position.z });
    entityEl.setAttribute('rotation', { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z });
    entityEl.setAttribute('scale', { x: transform.scale.x, y: transform.scale.y, z: transform.scale.z });
}
//오브젝트 삭제 
function DeleteObject(id){
    var entityEl = document.getElementById(id);
    totalEntities.splice(totalEntities.indexOf(id),1);
    sceneEl.removeChild(entityEl);
}


//이미지 삽입
function CreateImage(transform, width, height, material){
    var entityEl = document.createElement('a-image');
    sceneEl.appendChild(entityEl);

    var id = AssignId('image');
    entityEl.setAttribute('id',id);
    entityEl.setAttribute('geometry', {
        primitive: 'plane',
        height: height,
        width: width
    });
    entityEl.setAttribute('position', { x: transform.position.x, y: transform.position.y, z: transform.position.z });
    entityEl.setAttribute('rotation', { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z });
    entityEl.setAttribute('material', 'color', material['color']);
    entityEl.setAttribute('material', 'src', material['src']);
    //entityEl.setAttribute('material', 'opacity', material['opacity']);

    entityEl.addEventListener('click', function (evt) {
        console.log(id+"clicked");
        PrintTransform(id);
    });
}
//이미지 width, height반환
function GetImageSize(id){
    var entityEl = document.getElementById(id);

    var size = {
        width: entityEl.getAttribute('geometry',width),
        height: entityEl.getAttribute('geometry',height)
    }
    return size;
}
//이미지 width, height 수정
function UpdateImageSize(id,width,height){
    var entityEl = document.getElementById(id);

    entityEl.setAttribute('geometry', {
        primitive: 'plane',
        height: height,
        width: width
    });
}


//텍스트 삽입
function CreateText(transform, fontsize, material, value, font){
    var entityEl = document.createElement('a-text');
    sceneEl.appendChild(entityEl);

    var id = AssignId('text');
    entityEl.setAttribute('id',id);
    entityEl.setAttribute('text',{
        width: fontsize,
        value: value,
        color: material['color'],
        font: font
    });
    entityEl.setAttribute('position', { x: transform.position.x, y: transform.position.y, z: transform.position.z });
    entityEl.setAttribute('rotation', { x: transform.rotation.x, y: transform.rotation.y, z: transform.rotation.z });

    entityEl.addEventListener('click', function (evt) {
        console.log(id+"clicked");
        PrintTransform(id);
    });
    //entityEl.setAttribute('material', 'src', material['src']);
    //entityEl.setAttribute('material', 'opacity', material['opacity']);
}
//텍스트 value 수정
function UpdateTextValue(id, value){
    var entityEl = document.getElementById(id);
    
    entityEl.setAttribute('text',{
        value: value
    });
}
//텍스트 폰트 사이즈 수정
function UpdateTextFontSize(id, size){
    var entityEl = document.getElementById(id);
    
    entityEl.setAttribute('text',{
        width: size
    });
}


//sky(background)추가
function CreateSky(material){
    var entityEl = document.createElement('a-sky');
    sceneEl.appendChild(entityEl);

    var id = 'sky'+GetNumOfObject('sky');
    entityEl.setAttribute('id',id);
    entityEl.setAttribute('material','src',material['src']);
}


//Transform 출력
function PrintTransform(id){
    var transform = GetTransform(id);

    document.getElementById('position').innerHTML = "Position X:"+transform.position.x+" Y:"+transform.position.y+" Z:"+transform.position.z;
    document.getElementById('rotation').innerHTML = "Rotation X:"+transform.rotation.x+" Y:"+transform.rotation.y+" Z:"+transform.rotation.z;
    document.getElementById('scale').innerHTML = "Scale X:"+transform.scale.x+" Y:"+transform.scale.y+" Z:"+transform.scale.z;
}

//씬에 있는 오브젝트 수 반환
function GetNumOfObject(object){
    var entityEls = document.querySelectorAll('a-'+object);
    return entityEls.length-1;
}
function AssignId(primitive){
    var id = primitive+GetNumOfObject(primitive);
    totalEntities.push(id)
    return id;
}
