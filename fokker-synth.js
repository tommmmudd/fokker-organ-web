
/**
 * Define a specific voice
 * @param  {context} audio context
 */
voiceTemplate = (function(context) 
{
    function Voice(frequency)
    {
        this.frequency = frequency;
        this.oscillators = [];
        this.vca;
    };

    Voice.prototype.start = function() 
    {
        /* VCO */
        var vco = context.createOscillator();
        vco.type = "sine"; //vco.square;
        vco.frequency.value = this.frequency;

        var vco2 = context.createOscillator();
        vco2.type = "sine"; //vco.square;
        vco2.frequency.value = this.frequency * 2.0;
        var gain2 = context.createGain();
        gain2.gain.value = 0.2;

        var vco3 = context.createOscillator();
        vco3.type = "sine"; //vco.square;
        vco3.frequency.value = this.frequency * 4.0;
        var gain3 = context.createGain();
        gain3.gain.value = 0.1;

        var vco4 = context.createOscillator();
        vco4.type = "sine"; //vco.square;
        vco4.frequency.value = this.frequency * 6.0;
        var gain4 = context.createGain();
        gain4.gain.value = 0.06;

        /* VCA */
        this.vca = context.createGain();
        this.vca.gain.value = 0;
        this.vca.gain.setTargetAtTime(0.1, context.currentTime + 0.001, 0.01);

        /* connections */
        vco.connect(this.vca);
        vco2.connect(gain2);
        vco3.connect(gain3);
        vco4.connect(gain4);
        gain2.connect(this.vca);
        gain3.connect(this.vca);
        gain4.connect(this.vca);
        this.vca.connect(masterGain);

        vco.start(0);
        vco2.start(0);
        vco3.start(0);
        vco4.start(0);

        /* Keep track of the oscillators used */
        this.oscillators.push(vco);
        this.oscillators.push(vco2);
        this.oscillators.push(vco3);
        this.oscillators.push(vco4);
    };

    Voice.prototype.stop = function() 
    {
        this.vca.gain.setTargetAtTime(0, context.currentTime + 0.01, 0.15);

        // this.oscillators.forEach(function(oscillator, _) 
        // {
        //     oscillator.stop();
        // });
    };

    return Voice;
  });



/**
 * Convert midi note to Fokker 31 frequency (220 base freq)
 * @param  {noteIn} midi note
 */
function getFokkerHzFromNote(noteIn)
{

    baseFreq = 220;
    noteInRange = noteIn % noteCount;
    noteClass = Math.floor(noteInRange) % 31;
    octave = Math.floor(noteInRange / 31);
    //if (noteClass > 31) { noteClass = 31; }

    interval = Math.pow(2, 1.0/31.0);

    // console.log("class " + noteClass + "  oct: " + Math.pow(2, octave))

    ratio = Math.pow(interval, noteClass);

    multiplier = 0.5;
    /*
    if (noteIn >= 60) { multiplier = 1.0; }
    if (noteIn >= 96) { multiplier = 2.0; }
    */

    // console.log("note: " + noteClass + "   octave: " + octave)
    
    return ratio * baseFreq * multiplier * Math.pow(2, octave);
}


function startNote(noteIndex)
{
    var frequency = getFokkerHzFromNote(noteIndex);
    var voice = new Voice(frequency);
    active_voices[noteIndex] = voice;
    voice.start();

    // console.log("startNote: " + noteIndex);
    fokkerCanvasKeys[noteIndex].noteOn();
}

function stopNote(noteIndex)
{
    active_voices[noteIndex].stop();
    delete active_voices[noteIndex];

    // console.log("stopNote: " + noteIndex);
    fokkerCanvasKeys[noteIndex].noteOff();
}


function stopAllNotes()
{
    for (var i=0; i<noteCount*registers; i++)
    {
        if (active_voices[i])
        {
            active_voices[i].stop();
            delete active_voices[i];
            fokkerCanvasKeys[i].noteOff();    
        }
    }
}


/// Midi to frequency converter
function mtof(note)
{
  return Math.pow(2, (note-69)/12)*440;
}