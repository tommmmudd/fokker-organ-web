/**
 * A simple noise generator.
 *
 * @class RandomNoiseProcessor
 * @extends AudioWorkletProcessor
 */
class SineOsc extends AudioWorkletProcessor {

  constructor(options) {
    super();
    console.log("SineOsc constructor called");
    console.log(sampleRate);

    this.phase = 0;
    this.frequency = 440.0;
    this.phaseDelta = this.frequency / sampleRate;

  }

  update()
  {
    this.phase += this.phaseDelta;
    if (this.phase >= 1.0)
    {
      this.phase -= 1.0;
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    
    for (let channel = 0; channel < output.length; ++channel) {
      
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; i++) {

        if (channel == 0) {
          this.update();  
        }
        
        //console.log(this.phase);
        outputChannel[i] = Math.sin(Math.PI * 2.0 * this.phase) * 0.5;
      }
    }

    return true;
  }

  
}

registerProcessor("sine-processor", SineOsc);