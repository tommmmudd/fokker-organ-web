/**
 * Single Gutter oscillator. Requires Biquad and Delay classes 
 *
 * @class GutterOsc
 * @extends AudioWorkletProcessor
 */
class GutterOsc extends AudioWorkletProcessor {


  static get parameterDescriptors() {
    return [
      { name: 'damping', defaultValue: 0.25, minValue: 0.00001, maxValue: 1.0},
      { name: 'Q', defaultValue: 10, minValue: 0.1, maxValue: 1000},
      { name: 'delayTime', defaultValue: 50, minValue: 1, maxValue: 500},
      { name: 'mod', defaultValue: 0.1, minValue: 0, maxValue: 20},
      { name: 'rate', defaultValue: 0.125, minValue: 0, maxValue: 50},
      ];
  }

  constructor(options) {
    super();
    //console.log("GutterOsc constructor called");

    this.filterCount = 24;

    this.filters = [];//new Biquad()
    for (let i=0; i<this.filterCount; i++)
    {
      this.filters[i] = new Biquad(); 
      let randomFreq = Math.random() * Math.random() * Math.random() * 2000 + 45;
      //console.log(randomFreq);
      this.filters[i].setFreq(randomFreq);
      this.filters[i].setQ(10);
      this.filters[i].calcCoeffs();
    }
    

    this.delay = new Delay();
    this.delay.setDelayTimeInSamples(50);

    this.feedbackVal = 0;
    this.feedbackGain = 40.0;

    this.gamma = 0.1; 
    this.omega = 0.125;
    this.c = 0.3;
    this.t = 0;
    this.dt = 0.00005;
    this.duffX = 0;
    this.duffY = 0;
    this.gain = 0.5;

    this.port.onmessage = (e) => {
      if (e.data[0] =="setFreq")
      {
        this.setFreq(e.data[1]);
      }
      else if (e.data[0] =="setQ")
      {
        this.setQ(e.data[1]);
      }
      else if (e.data[0] =="randomiseFilters")
      {
        this.randomiseFilters();
      }
      else if (e.data[0] =="randomiseFiltersLow")
      {
        this.randomiseFiltersLow();
      }
      else if (e.data[0] =="minorFilters")
      {
        this.minorFilters(e.data[1]);
      }
    }

  }

  update()
  {
    this.phase += this.phaseDelta;
    if (this.phase >= 1.0)
    {
      this.phase -= 1.0;
    }
  }



  getValueOfParam(floatOrList, index) {
    if (floatOrList.length === 1) {
      return parseFloat(floatOrList);
    }
    else {
      return floatOrList[index];
    }
  }


  process(inputs, outputs, parameters) {

    const inputData = inputs[0][0];

    var output = outputs[0];

    let Q = this.getValueOfParam(parameters.Q, 0);
    let delayTime = this.getValueOfParam(parameters.delayTime, 0);

    
    for (let channel = 0; channel < output.length; ++channel) {
      
      const outputChannel = output[channel];
      var outputVal = 0.0;

      for (let i = 0; i < outputChannel.length; i++) {

        if (channel == 0) {

          //outputVal = this.processSample();
          this.gamma = this.getValueOfParam(parameters.mod, i);
          this.omega = this.getValueOfParam(parameters.rate, i);
          this.c = this.getValueOfParam(parameters.damping, i);

          let filtered = 0.0;//this.filter.process(nextInput);

          for (let j=0; j<this.filterCount; j++)
          {
            filtered += this.filters[j].process(this.duffX);
          }

          filtered *= this.gain;

          // mix damping with input
          // console.log(inputData[i]);
          let c = this.c + inputData[i];
          if (c > 1.0)    { c = 1.0;  }
          if (c < 0.0001) { c = 0.0001; }

          let dy = filtered - (filtered*filtered*filtered) - (c*this.duffY) + this.gamma*Math.sin(this.omega * this.t)
          this.duffY += dy;
          let dx = this.duffY;

          this.duffX = Math.atan(filtered + dx);

          this.t += this.dt;

          if (isNaN(this.duffX)) { this.resetDuff(); }

          outputVal = filtered * 0.75;
        }
        
        //console.log(this.phase);
        outputChannel[i] = outputVal;
      }
    }

    return true;
  }

  resetDuff() { this.duffX = 0; this.duffY = 0; this.dx = 0; this.dy = 0; this.t = 0; }

  // need to send message via "port??"
  // see here: https://stackoverflow.com/questions/61070615/how-can-i-import-a-module-into-an-audioworkletprocessor-that-is-changed-elsewher
  setFreq(newFreq)  
  { 
    for (let j=0; j<this.filterCount; j++)
    {
      this.filters[j].setFreq(newFreq * (j+1)); 
      this.filters[j].calcCoeffs(); 
    }
  }

  randomiseFilters()
  {
    this.filterCount = 24;
    for (let j=0; j<this.filterCount; j++)
    {
      let randomFreq = Math.random() * Math.random() * Math.random() * 5055 + 45;
      this.filters[j].setFreq(randomFreq);
      this.filters[j].calcCoeffs();
    }
  }

  randomiseFiltersLow()
  {
    this.filterCount = 24;
    for (let j=0; j<this.filterCount; j++)
    {
      let randomFreq = Math.random() * Math.random() * Math.random() * Math.random() * Math.random() * 5055 + 45;
      this.filters[j].setFreq(randomFreq);
      this.filters[j].calcCoeffs();
    }
  }

  minorFilters(baseNote)
  {
    this.filterCount = 4;
    let harmonics = [55, 110.6, 166.7, 220.1];
    for (let j=0; j<this.filterCount; j++)
    {
      let scaler = Math.exp(0.057762265 * baseNote);  // transratio
      let freq = harmonics[j] * scaler;
      this.filters[j].setFreq(freq);
      this.filters[j].calcCoeffs();
    }
  }


  setQ(newQ)
  {
    for (let j=0; j<this.filterCount; j++)
    {
      this.filters[j].setQ(newQ);
      this.filters[j].calcCoeffs();
    }
  }

  setDelayTime(newDelayTime)  { this.delay.setDelayTimeInSamples(newDelayTime); }

  
}

registerProcessor("gutter-osc-processor", GutterOsc);
console.log("Adding module gutter-osc-processor (GutterOsc)");





// Basic Biquad stuck in bandpass mode
class Biquad
{
  constructor()
  {
    this.a0, this.b2, this.b1, this.b2;
    this.filterFreq = 100;
    this.Q = 3;
    this.V = Math.pow(10, 1.0 / 20); // 1.0 was gain, now fixed
    this.sampleRate = 44100;

    this.targetFreq = this.filterFreq;
    this.transitionTimeInSamples = 1500;
    this.transitionFreq = this.filterFreq;
    this.transitionCounter = this.transitionTimeInSamples; 


    this.prevX2 = 0; this.prevX1 = 0; this.prevY1 = 0; this.prevY2 = 0;
  }

  setFreq(newFreq)  { this.targetFreq = newFreq; this.transitionFreq = this.filterFreq; this.transitionCounter = 0; }
  //setFreq(freq) { this.filterFreq = freq; }
  setQ(_q) { this.Q = _q; }

  calcCoeffs()
  {
    let K = Math.tan(3.141592653589793 * this.filterFreq / this.sampleRate);
    let norm = 1 / (1 + K / this.Q + K * K);
    this.a0 = K / this.Q * norm;
    this.a2 = -this.a0;
    this.b1 = 2 * (K * K - 1) * norm;
    this.b2 = (1 - K / this.Q + K * K) * norm;
  }
  
  process(inVal)
  {

    if (this.transitionCounter < this.transitionTimeInSamples)
    {
      this.filterFreq += (this.targetFreq - this.transitionFreq) / this.transitionTimeInSamples;
      this.transitionCounter += 1;
      this.calcCoeffs();
    }

    let y = this.a0*inVal  +  this.a2*this.prevX2  -  this.b1*this.prevY1  -  this.b2*this.prevY2;
    this.prevX2 = this.prevX1;
    this.prevX1 = inVal;
    this.prevY2 = this.prevY1;
    this.prevY1 = y;
    return y;  
  }
}


// Moog filter based on Noise Hack implementation:
// https://noisehack.com/custom-audio-effects-javascript-web-audio-api/
// from musicdsp example: 
// http://www.musicdsp.org/showArchiveComment.php?ArchiveID=26
class Moog {

  constructor(context)
  {
    let bufferSize = 256;
    this.in1, this.in2, this.in3, this.in4, this.out1, this.out2, this.out3, this.out4;
    this.in1 = 0; this.in2 = 0; this.in3 = 0; this.in4 = 0;  this.out1 = 0; this.out2 = 0; this.out3 =  0;this.out4 = 0.0;
    
    this.cutoff = 660; // NOT between 0.0 and 1.0, now between 20-20000
    this.resonance = 1.99; // between 0.0 and 4.0

    this.targetFreq = this.cutoff;
    this.transitionTimeInSamples = 1500;
    this.transitionFreq = this.cutoff;
    this.transitionCounter = this.transitionTimeInSamples; 

    this.sampleRate = 44100; // TODO function to update this
  }

  test()
  { return 0.0; }

  process(inSamp)
  {
    var f = (2 * this.cutoff / this.sampleRate) * 1.16;
    var fb = this.resonance * (1.0 - 0.15 * f * f);

    if (this.transitionCounter < this.transitionTimeInSamples)
    {
      this.cutoff += (this.targetFreq - this.transitionFreq) / this.transitionTimeInSamples;
      this.transitionCounter += 1;
    }
    inSamp -= this.out4 * fb;
    inSamp *= 0.35013 * (f*f)*(f*f);
    this.out1 = inSamp + 0.3 * this.in1 + (1 - f) * this.out1; // Pole 1
    this.in1 = inSamp;
    this.out2 = this.out1 + 0.3 * this.in2 + (1 - f) * this.out2; // Pole 2
    this.in2 = this.out1;
    this.out3 = this.out2 + 0.3 * this.in3 + (1 - f) * this.out3; // Pole 3
    this.in3 = this.out2;
    this.out4 = this.out3 + 0.3 * this.in4 + (1 - f) * this.out4; // Pole 4
    this.in4 = this.out3;

    return this.out4;
  }
    
  setFreq(newFreq)  { this.targetFreq = newFreq; this.transitionFreq = this.cutoff; this.transitionCounter = 0; }
}



// SIMPLE DELAY CLASS - currently fixed max duration at 1000 samples..
class Delay
{
  constructor()
  {
    this.buffer = [];
    this.size = 1000;
    this.readPos = 0;
    this.writePos = 0;

    for (let i=0; i<this.size; i++)
    {
      this.buffer[i] = 0.0;
    }

  }

  readVal()
  {
      // get current value at readPos
      let outVal = this.linearInterpolation(); //this.buffer[this.readPos];
      // increment readPos
      this.readPos ++;
      
      if (this.readPos >= this.size)
          this.readPos = 0;
   
      return outVal;
  }

  linearInterpolation()
  {
      // get buffer index
      let indexA = Math.floor(this.readPos);
      let indexB = indexA + 1;
      
      // wrap
      if (indexB >= this.size)
          indexB -= this.size;
      
      let valA = this.buffer[indexA];
      let valB = this.buffer[indexB];
      
      let remainder = this.readPos - indexA;
      
      let interpolatedValue = (1-remainder)*valA  +  remainder*valB;
      
      return interpolatedValue;
      
  }

  writeVal(inputSample)
  {
      // store current value at writePos
      this.buffer[this.writePos] = inputSample;
      
      // increment writePos
      this.writePos ++;
      
      if (this.writePos >= this.size)
          this.writePos = 0;
  }

  process(inputSample)
  {
    let outVal = this.readVal(inputSample);
    this.writeVal(inputSample);
    return outVal;
  }

  setDelayTimeInSamples(delayTimeInSamples)
  {
    if (delayTimeInSamples > this.size)
        delayTimeInSamples = this.size;
    
    if (delayTimeInSamples < 1)
        delayTimeInSamples = 1;
    
    this.readPos = this.writePos - delayTimeInSamples;
    
    // if readPos < 0, then add size to readPos
    if (this.readPos < 0)
        this.readPos += this.size;
  }
}