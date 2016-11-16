var videoLocal = document.getElementById('localVideo');
var videoRemote = document.getElementById('remoteVideo');
var pc;
var localDataChannel;
var remoteDataChannel;
var remoteStream;
var constraints = window.constraints = {
  audio: false,
  video: {
    width: {max: 320},
    height: {max: 320},
  }
};
var errorElement = document.querySelector('#errorMsg');

var nameRoom = ["Alpha", "Beta", "Gamma", "Delta"];
var diccionarioNombres = [];
var sala;
var yo;
var usuario;
var anfitrion;
var abierto=false;

var boolDebug = 1;
function mydebug(sms){
  if (boolDebug){
    console.log(sms);
  }
}

$(function() {
  $("#join").click(onJoin);
  $("#connect").click(onConnect);
  $("#exit").click(onExit);
  $("#send").click(onSend);
  state("inicial");
});

//-------------------------INICIO-----------------------------------------------
function onJoin(){
  mydebug("onJoin");
  getUserData();
  preparePeerConnection();
  sendRoom();
  state("final");
  getUserMedia();
}

function getUserData(){
  sala = $("#room")[0].value;
  yo = $("#user")[0].value;
  anfitrion = false;
  mydebug("Datos de usuario: "+sala+" "+yo);
}

function preparePeerConnection(){
  mydebug("Preparando el PC");
  var config = null;
  pc = new RTCPeerConnection(config);

  pc.onicecandidate = handleIceCandidate;
  pc.onaddstream = gotRemoteStream;
  //DataChannel
  pc.ondatachannel = onDataChannel;

  localDataChannel = pc.createDataChannel(null);
  localDataChannel.onopen = onOpen;
  localDataChannel.onclose = onClose;
  mydebug("Preparado el PC");
  abierto=true;
}

function gotRemoteStream(event){
  remoteVideo.srcObject = event.stream;
  handleSend(false);
}

function onDataChannel(event){
  remoteDataChannel = event.channel;
  remoteDataChannel.onmessage = onMessage;
}

function onMessage(event){
  $("#dataChannelReceive").append(usuario+": "+event.data+"\n");
  bajar();
}

function onSend(){
  var sms = $("#dataChannelSend")[0].value;
  $("#dataChannelSend")[0].value = "";
  $("#dataChannelReceive").append(yo+": "+sms+"\n");
  bajar();
  localDataChannel.send(sms);
}

function sendRoom(){
  mydebug("Send room");
  var sms = {
    room: sala,
    user: yo
  };
  mydebug("Room: "+sala+" User: "+yo);
  socket.emit('create or join', JSON.stringify(sms));
}

function handleIceCandidate(event){
  mydebug("Entro handleIceCandidate");
  if(event.candidate){
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }else{
    mydebug("Fin handleCandidate");
  }
}
/*function handleIceCandidate(event){
  mydebug("Entro handleIceCandidate");
  if(event.candidate){
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  }else{
    mydebug("Fin handleCandidate");
  }
}*/

function doAnswer(){
  mydebug("Enviando contestacion candidatos");
  pc.createAnswer(null)
  .then(gotLocalDescriptionAndSend)
  .catch(handleError);
}

function getUserMedia(){
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
    var videoTracks = stream.getVideoTracks();
    console.log('Got stream with constraints:', constraints);
    console.log('Using video device: ' + videoTracks[0].label);
    stream.onended = function() {
      console.log('Stream ended');
    };
    window.stream = stream; // make variable available to browser console
    videoLocal.srcObject = stream;
    pc.addStream(stream);
  })
  .catch(function(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
      errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
          constraints.video.width.exact + ' px is not supported by your device.');
    } else if (error.name === 'PermissionDeniedError') {
      errorMsg('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    errorMsg('getUserMedia error: ' + error.name, error);
  });
}
//--------------------FIN--INICIO-----------------------------------------------

//-------------------------CONNECT----------------------------------------------
function onConnect(){
  pc.createOffer(null)
  .then(gotLocalDescriptionAndSend)
  .catch(handleError);
  state("final");
}

function gotLocalDescriptionAndSend(description){
  pc.setLocalDescription(description)
  .catch(handleError);
  sendMessage(description);
  mydebug("envio: "+description);
}

//--------------------FIN--CONNECT----------------------------------------------

//----------------------------EXIT----------------------------------------------
function onExit(){
  window.stream.getVideoTracks().forEach(function(closeTrack){
    closeTrack.stop();
  });
  abierto=false;
  socket.emit('bye', sala);
  pc.close();
  resetFormat();
  state("inicial");

}
//-----------------------FIN--EXIT----------------------------------------------

//--------------------OTROS-MANEJADORES-----------------------------------------
function sendMessage(sms){
  mydebug("Mensaje: "+sms);
  socket.emit('message', sms);
}

function errorMsg(msg, error) {
  errorElement.innerHTML += '<p>' + msg + '</p>';
  if (typeof error !== 'undefined') {
    console.error(error);
  }
}
function handleError(error){
  console.log(error)
}

function onOpen(){
  console.log("Abro localDataChannel");
}
function onClose(){
  console.log("Cierro localDataChannel");
}

function handleSend(disable){
  $("#dataChannelSend")[0].disabled=disable;
  $("#send")[0].disabled=disable;
}
//-----------------FIN--OTROS-MANEJADORES---------------------------------------

//-------------------------VISUAL-----------------------------------------------
function titles(opcion){
  if (opcion){
    $("#local")[0].value = yo;
    $("#remote")[0].value = usuario;
  }else{
    $("#local")[0].value = "Local";
    $("#remote")[0].value = "Remoto";
    $("#dataChannelReceive").append("Has salido de la sala.\n");
    bajar();
  }
}

function resetFormat(){
  titles(false);
}

function bajar(){
  $("#area").append("your text to append");
  var console = $('#dataChannelReceive');
  console.scrollTop(
    console[0].scrollHeight - console.height()
  );
}

function state(state){
  mydebug("Cambiado al estado: "+state);
  switch(state) {
    case "inicial":
      //botones
      $("#join").show();
      $("#connect").hide();
      $("#exit").hide();
      //cuadros de texto
      $("#user").show();
      $("#room").show();
      handleSend(true);
      break;
    case "intermedio":
      //botones
      $("#join").hide();
      $("#connect").show();
      $("#exit").show();
      //cuadros de texto
      $("#user").hide();
      $("#room").hide();
      break;
    case "final":
      //botones
      $("#join").hide();
      $("#connect").hide();
      $("#exit").show();
      //cuadros de texto
      $("#user").hide();
      $("#room").hide();
      break;
    default:
      //default code block
  }
}
//---------------------FIN-VISUAL-----------------------------------------------

//-------------------------SOCKET-----------------------------------------------
var socket = io.connect();

socket.on('created', function(message){
  var sms = JSON.parse(message);
  anfitrion = sms.anfitrion;
  $("#dataChannelReceive").append("Has creado la sala "+nameRoom[sala]+"\n");
  bajar();
});

socket.on('joined', function(message){
  var sms = JSON.parse(message);
  if (anfitrion){
    state("intermedio");
    usuario = sms.usuario2;
    $("#dataChannelReceive").append("Se ha unido el usuario "+usuario+", puedes iniciar la comunicación pulsando conectar.\n");
  }else{
    usuario = sms.usuario1;
    $("#dataChannelReceive").append("Te has unido a la sala "+nameRoom[sala]+" con el usuario "+usuario+"\n");
  }
  //$("#dataChannelReceive").append("Bienvenido a la sala "+nameRoom[sala]+"\n");
  bajar();
  titles(true);
});

socket.on('full', function(message){
  sms1 = '<div class="alert alert-warning alert-dismissible" role="alert">';
  sms2 = '<button type="button" class="close" data-dismiss="alert"';
  sms3 = ' aria-label="Close"><span aria-hidden="true">&times;</span>';
  sms4 = '</button><strong>¡Sala completa!</strong> Intenta conectarte a otra '
  sms5 =  "sala o intentalo más tarde.</div>";
  sms = sms1+sms2+sms3+sms4+sms5;
  $("#full").append(sms);
  //pc.close();
  state("inicial");
});

socket.on('log', function (array){
  array.forEach(mydebug);
});

socket.on('message', function (sms){
  switch(sms.type) {
    case 'offer':
      pc.setRemoteDescription(new RTCSessionDescription(sms));
      doAnswer();
      break;
    case 'answer':
      mydebug("respuesta: "+sms);
      pc.setRemoteDescription(new RTCSessionDescription(sms));
      break;
    case 'candidate':
      var candidate = new RTCIceCandidate({
        sdpMLineIndex:sms.label,
        candidate:sms.candidate
      });
      pc.addIceCandidate(candidate);
      break;
    default:
  }
});

socket.on('bye', function (){
  if (abierto){
    window.stream.getVideoTracks().forEach(function(closeTrack){
      closeTrack.stop();
    });
    try{
      pc.close()
    }catch(error){
      console.log("Aviso: Se ha intentado cerrar el pc cuando ya estaba cerrado")
    };
    resetFormat();
    state("inicial");
    abierto=false;
  }
})
//---------------------FIN-SOCKET-----------------------------------------------
