const audioContext = new AudioContext();
const masterGain = audioContext.createGain();

var Voice = voiceTemplate(audioContext);

// keep track of voices
active_voices = {};

noteCount = 93;
registers = 2;
currentNote = -1;
toggleMode = true;



// Fokker keyboard canvas
var fokkerCanvas = document.querySelector('.fokker-canvas');
var fokkerCtx = fokkerCanvas.getContext("2d");


// Class for each key in the interface
var Key = keyTemplate(fokkerCtx);

var fokkerCanvasKeys = {};
for (var i=0; i<noteCount; i++)
{
  var note = i;
  var yDisplacement = 0;
  var newKey = new Key(note, 0);
  fokkerCanvasKeys[note] = newKey;

  var newKeyLower = new Key(note, 1);
  fokkerCanvasKeys[note + noteCount] = newKeyLower
}

// create some keys (currently 1 octave)
// createKeys(fokkerCtx);





fokkerCanvas.addEventListener("mousedown", function (e) 
{
  currentNote = getMousePosition(fokkerCanvas, e);
  if (currentNote > -1)
  {
    if (toggleMode)
    {
      if (fokkerCanvasKeys[currentNote].isPressed)
      {
        // Turn Off
        stopNote(currentNote);
        currentNote = -1;
      }
      else
      {
        // Turn On
        startNote(currentNote);
      }
    }

    
    
  }
})

fokkerCanvas.addEventListener("mouseup", function (e) 
{
  // note = getMousePosition(fokkerCanvas, e);
  if (currentNote > -1)
  {

    if (toggleMode)
    {
      // do nothing 
    }
    else 
    {
      stopNote(currentNote);
      currentNote = -1;
    }

    

  }
})



// =================================
// STRUCTURE AND INITIALISATION
// called below when the button is pressed for the first time
const startAudio = async (context) => {


  // =================================
  // SETUP 
  // console.log("Adding additional modules");
  // await context.audioWorklet.addModule('sine-processor.js');
  // await context.audioWorklet.addModule(new URL('./gutter-osc-processor.js', import.meta.url))


  // ELEMENTS
  // const sineOsc = new AudioWorkletNode(context, 'sine-processor');
  // master gain now defined globally so interface can be drawn
  masterGain.gain.value = 0.25;

  // TODO: add compressor

  // const osc = context.createOscillator();
  // osc.frequency.setValueAtTime(330, context.currentTime);
  // const oscGain = context.createGain();
  // oscGain.gain.value = 0.01;

  // osc.start();


  // GRAPH
  // sineOsc.connect(masterGain);
  masterGain.connect(context.destination);

  // Fade in (avoiding hard transient)
  masterGain.gain.setTargetAtTime(0.25, context.currentTime + 0.1, 1);
  

  // =================================
  // =================================
  // PARAMETERS


  // (2) Gain slider 
  const gainSlider = document.querySelector(".gain"); // get the html element (class is "freq")
  gainSlider.value = 0.5;      // set slider to node value

  gainSlider.addEventListener('input', function() 
  {
    var newGain = this.value * 0.5;
    masterGain.gain.setTargetAtTime(newGain, context.currentTime, 0.015);
  }, "false");

  /*
  var dampingParam = gutterOsc.parameters.get("damping");
  //var dampingParam = gutterOsc.parameters.get("damping");
  var tempQ = 3.0;


  // 2D Slider
  $('#slider').range2DSlider({

    // visual setup
    grid:true,
    axis:[[0, 2, 4, 6, 8, 10],[0, 2, 4, 6, 8, 10]],
    projections:true,
    height:'400px',
    width:'400px',
    showLegend:[0,0],
    allowAxisMove:['both'],

    // what to do with the data (2d)
    printLabel:function( val )
    {
      let x = val[0] * 0.1;
      // var newFreq = ((x * x) * 350.0) + 45.0;
      //gutterOsc.port.postMessage(['setFreq', newFreq]); 
      if (tempQ != x*x*200.0 + 0.1)
      {
        tempQ = x*x*200.0 + 0.1;
        gutterOsc.port.postMessage(['setQ', tempQ]); 
      }
      

      let y = val[1] * 0.1;
      dampingParam.linearRampToValueAtTime(y * y * y + 0.00001, context.currentTime + 0.001);

      this.projections&&this.projections[0].find('.xdsoft_projection_value_x').text(val[1].toFixed(5));
      return val[0].toFixed(2) + ", " + val[1].toFixed(2);
    }
  }).range2DSlider('value',[[5,5]]);

  $('#slider').range2DSlider();
  */


  

};





// =========================
// VISUALISATION

var analyser = audioContext.createAnalyser();
masterGain.connect(analyser);

analyser.fftSize = 4096;
var bufferLength = analyser.frequencyBinCount;
var bufferToUse = bufferLength/6
var dataArray = new Uint8Array(bufferToUse);

var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");



//canvasCtx.fillStyle = 'rgb(200, 100, 50)';
//canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
fokkerCtx.clearRect(0, 0, fokkerCanvas.width, fokkerCanvas.height);

function draw() {

  // =======================================
  // Visualiser
  drawVisual = requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  canvasCtx.fillStyle = 'rgb(239, 239, 239)';//  - this is #efefef? or use 'white'
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  var barWidth = (canvas.width / bufferToUse) * 2.5;
  var barHeight;
  var x = 0;
  for(var i = 0; i < bufferToUse; i++) 
  {
    barHeight = dataArray[i]/2;
    barHeight = barHeight / 150.0;
    barHeight *= barHeight*barHeight;
    barHeight *= 160

    canvasCtx.fillStyle = 'rgb(50,50,'+(barHeight+50)+')';
    canvasCtx.fillRect(x, canvas.height - barHeight/2, barWidth, barHeight);

    x += barWidth + 1;
  }


  // =======================================
  // Fokker Keyboard canvas
  // fokkerCtx.fillRect(25, 25, 100, 100);
  // fokkerCtx.clearRect(45, 45, 60, 60);
  // fokkerCtx.strokeRect(50, 50, 50, 50);

  fokkerCtx.font = "10px sansserif";
  fokkerCtx.textAlign = "center"

  for (var i=0; i<(noteCount * registers); i++)
  {
    fokkerCanvasKeys[i].draw();
  }


};

draw();




// ========================================
// Power button

const powerButton = document.getElementById('onOff');   // power button from HTML

var notYetOn = true;                        // has the audio yet to be started for the first time?


if (powerButton)
{
  powerButton.addEventListener('click', async () => {

    // if it's on, turn it off
    if (powerButton.dataset.power === 'on') {

      audioContext.suspend();       // turn the audio off

      // set button state, text, and colour
      powerButton.dataset.power = 'off';
      powerButton.innerHTML = "Turn Audio On";
      powerButton.style.background = "#efefef";

      console.log("switching off");
    }

    // otherwise, turn it on/restart it
    else {

      if (notYetOn) {
        await startAudio(audioContext);     // <-- calls function above
        notYetOn = false;                   // disable the one-time flag so that the startup is not run multiple times
      }

      audioContext.resume();      // turn audio on

      // set button state, text, and colour
      powerButton.dataset.power = 'on';
      powerButton.innerHTML = "Turn Audio Off";
      powerButton.style.background = "#4CCF90";

      console.log("switching on");
    }

  }, false);
}

// ===========
// stop all notes button
const stopAllNotesButton = document.getElementById('stopAllNotes');   // power button from HTML

if (stopAllNotesButton)
{
  stopAllNotesButton.addEventListener('click', async () => { stopAllNotes(); } );
}
