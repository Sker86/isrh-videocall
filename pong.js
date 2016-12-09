var gl = null,
canvas = null,
glProgram = null,
fragmentShader = null,
vertexShader = null;
var vertexPositionAttribute = null,
trianglesVerticeBuffer = null;
var vertexColorAttribute = null,
trianglesColorBuffer = null;
var mvMatrix = mat4.create();
var posRaq1=0;
var posRaq2=0;
var pointsP1=0;
var pointsP2=0;
var stop = 1;

//-------------------------Eventos de teclado --------------------------------//
window.addEventListener('keydown', function(event) {
  if ((conectado)&&(!stop)&&(anfitrion)){
    switch (event.keyCode) {
      case 38: // Up
        if (posRaq1<0.85){posRaq1=posRaq1+0.05;}
      break;
      case 40: // Down
        if (posRaq1>-0.85){posRaq1=posRaq1-0.05;}
      break;
      case 80: //p
        stopPong(0);
      break;
    }
  }else if ((conectado)&&(stop)&&(anfitrion)){
    switch (event.keyCode) {
      case 80: //p
        playPong();
      break;
    }
  }else if(conectado){ //no anfitrion
    switch (event.keyCode){
      case 38: // Up
        var sms = {
          raq2: 0.05,
          pausa: 0
        }
        sendGameP2(sms);
      break;
      case 40: // Down
        var sms = {
          raq2: -0.05,
          pausa: 0
        }
        sendGameP2(sms);
      break;
      case 80: //p
        var sms = {
          raq2: 0,
          pausa: 1
        }
        sendGameP2(sms);
      break;
    }
  }
}, false);

//------------FIN----------Eventos de teclado --------------------------------//

socket.on('game', function (message){
  var sms = JSON.parse(message);
  if (anfitrion){
    if(sms.raq2>0){
      if (posRaq2<0.85){posRaq2+=sms.raq2;}
    }else{
      if (posRaq2>-0.85){posRaq2+=sms.raq2;}
    }
    if (sms.pausa){
      if (!stop){
        stopPong(0);
      }else{
        playPong();
      }
    }
  }else{
    posRaq1=sms.raq2;
    posRaq2=sms.raq1;
    anglex=-sms.bolax;
    angley=sms.bolay;
    pointsP1=sms.scoreP2;
    pointsP2=sms.scoreP1;
    marcador();
  }
});


function initWebGL() {
  canvas = document.getElementById("my-canvas");
  try {
    gl = canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl");
  } catch (e) {
  }
  if (gl) {
    initShaders();
    setupBuffers();
    getUniforms();
    (function animLoop() {
      setupWebGL();
      drawScene();
      requestAnimationFrame(animLoop, canvas);
    })();
  } else {
    alert("Error: Your browser does not appear to support WebGL.");
  }
}
function setupWebGL() {
  //set the clear color to a shade of green
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(0, 0, canvas.width, canvas.height);
}
function initShaders() {
  //get shader source
  var fs_source = document.getElementById('shader-fs').innerHTML,
  vs_source = document.getElementById('shader-vs').innerHTML;
  //compile shaders
  vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
  fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);
  //create program
  glProgram = gl.createProgram();
  //attach and link shaders to the program
  gl.attachShader(glProgram, vertexShader);
  gl.attachShader(glProgram, fragmentShader);
  gl.linkProgram(glProgram);
  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  //use program
  gl.useProgram(glProgram);
}
function makeShader(src, type) {
  //compile the vertex shader
  var shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
  }
  return shader;
}
function setupBuffers() {
  var triangleVertices = [
          //triangle Vertices
          1.0,  1.0, 0.0,
         -1.0,  1.0, 0.0,
          1.0, -1.0, 0.0,
  ];
  trianglesVerticeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

  var triangleColors = [
          // triangle Colors
          1.0, 1.0, 1.0,
          1.0, 1.0, 1.0,
          1.0, 1.0, 1.0,
  ];
  trianglesColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);
}
function drawScene() {
  vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

  drawRaqueta1();
  drawRaqueta2();
  drawPelota();
}

function drawRaqueta1(){
  setUniforms(1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  setUniforms(2);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function drawRaqueta2(){
  setUniforms(3);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  setUniforms(4);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
function drawPelota(){
  setUniforms(5);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  setUniforms(6);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function getUniforms() {
  glProgram.uMVMatrix = gl.getUniformLocation(glProgram, "uMVMatrix");
  glProgram.uPMatrix = gl.getUniformLocation(glProgram, "uPMatrix");
  var pMatrix = mat4.create();
  var ratio = canvas.width/canvas.height;
  mat4.ortho(-ratio, ratio, -1.0, 1.0, -10.0, 10.0, pMatrix);
  gl.uniformMatrix4fv(glProgram.uPMatrix, false, pMatrix);
}

//raquetas
var angle = 0.0;
//pelota
var anglex  = 0.01*Math.random();
var angley  = 0.01*Math.random();
var sumx    = Math.random() < 0.5 ? -1 : 1;
var sumy    = Math.random() < 0.5 ? -1 : 1;

function setUniforms(x) {
  if(!conectado){
    stopPong(0);
    resetPong();
    pointsP1=0;
    pointsP2=0;
  }
  if((!stop)&&(anfitrion)){
    angle += 0.005;
  }
  mat4.identity(mvMatrix);
  switch(x) {
    case 1: //raqueta 1
      mat4.translate(mvMatrix, [0.0 , posRaq1, 0.0]);
      mat4.translate(mvMatrix, [-1.2 , 0.0, 0.0]);
      mat4.scale(mvMatrix, [-0.02, -0.15, 0.0]);
      break;
    case 2: //raqueta 1
      mat4.translate(mvMatrix, [0.0 , posRaq1, 0.0]);
      mat4.translate(mvMatrix, [-1.2 , 0.0, 0.0]);
      mat4.scale(mvMatrix, [0.02, 0.15, 0.0]);
      break;
    case 3: //raqueta 2
      mat4.translate(mvMatrix, [0.0 , posRaq2, 0.0]);
      mat4.translate(mvMatrix, [1.2 , 0.0, 0.0]);
      mat4.scale(mvMatrix, [-0.02, -0.15, 0.0]);
      break;
    case 4: //raqueta 2
      mat4.translate(mvMatrix, [0.0 , posRaq2, 0.0]);
      mat4.translate(mvMatrix, [1.2 , 0.0, 0.0]);
      mat4.scale(mvMatrix, [0.02, 0.15, 0.0]);
      break;
    case 5: //pelota
      if ((!stop)&&(anfitrion)){
        if(anglex>=1.16 || anglex<=-1.16){
          sumx=sumx*(-1)
        }
        if(angley>=0.99 || angley<=-0.99){
          sumy=sumy*(-1)
        }
        anglex += (0.007*sumx);
        angley += (0.007*sumy);
        sendGameP1();
      }
      mat4.translate(mvMatrix, [anglex , angley, 0.0]);
      mat4.scale(mvMatrix, [-0.02, -0.02, 0.0]);
      break;
    case 6: //pelota
      mat4.translate(mvMatrix, [anglex , angley, 0.0]);
      mat4.scale(mvMatrix, [0.02, 0.02, 0.0]);
      break;
    }
    if((!stop)&&(anfitrion)){
      checkPoint();
    }
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
}
function checkPoint(){
  var anchoRaqueta = 0.188;
  if(!stop){
    if (anglex < -1.15){
      var topRaqueta = posRaq1 + anchoRaqueta;
      var downRaqueta = posRaq1 - anchoRaqueta;
      if ((angley > topRaqueta)||(angley < downRaqueta)){
        pointsP2+=1;
        sendGameP1();
        stopPong(2);
      }
    }else if (anglex > 1.15){
      var topRaqueta = posRaq2 + anchoRaqueta;
      var downRaqueta = posRaq2 - anchoRaqueta;
      if ((angley > topRaqueta)||(angley < downRaqueta)){
        pointsP1+=1;
        sendGameP1();
        stopPong(1);
      }
    }
  }
}
function stopPong(x){
  stop=1;
  if(x){
    setTimeout(function(){
      resetPong();
      marcador();
      playPong();
    }, 2000);
  }
}
function resetPong(){
  posRaq1=0;
  posRaq2=0;
  anglex=0;
  angley=0;
  sumx = Math.random() < 0.5 ? -0.5 : 1;
  sumy = Math.random() < 0.5 ? -1 : 0.5;
}
function playPong(){
  stop=0;
}
function marcador(){
  $("#puntosLocal")[0].value = "Puntos: "+pointsP1;
  $("#puntosRemoto")[0].value = "Puntos: "+pointsP2;
}

function sendGameP1(){
  var sms = {
    raq1: posRaq1,
    raq2: posRaq2,
    bolax: anglex,
    bolay: angley,
    scoreP1: pointsP1,
    scoreP2: pointsP2
  }
  socket.emit('game', JSON.stringify(sms));
}

function sendGameP2(sms){
  socket.emit('game', JSON.stringify(sms));
}
