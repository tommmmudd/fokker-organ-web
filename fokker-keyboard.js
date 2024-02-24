// where are the keys?
// index here is "note", so notes[0], notes[1], notes[2] are all x = 0 for example
keyXpos = [0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 11, 11];
keyYpos = [0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 5, 2, 4, 1, 3, 5, 2, 4, 1, 3, 5, 2,  4,  1,  3,  5 ];
noteXOffsets = [0, 3, 5, 8, 10, 13, 16, 18, 21, 23, 26, 28, 28];
colBlue = "rgb(178 217 255)";
colWhite = "rgb(242 242 242)";
colBlack = "rgb(13 13 13)";
colPressed = "rgb(199 193 113)";
keyColours = [colBlue, colWhite, colBlue, colBlack, colBlack, colBlue, colWhite, colBlue, colBlack, colBlack, colBlue, colWhite, colBlue, colBlue, colWhite, colBlue, colBlack, colBlack, colBlue, colWhite, colBlue, colBlack, colBlack, colBlue, colWhite, colBlue, colBlack, colBlack, colBlue, colWhite, colBlue];
keyLabels = ["CL", "C", "Ct", "C#", "Db", "DL", "D", "Dt", "D#", "Eb", "EL", "E", "Et", "FL", "F", "Ft", "F#", "Gb", "GL", "G", "Gt", "G#", "Ab", "AL", "A", "At", "A#", "Bb", "BL", "B", "Bt"];
// define a grid for the xpositions and ypositions of each key for later lookup with xIndex and yIndex
xPatternMap = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];

xBorder = 35;
yBorder = 350;

keyWidth = 30;
widthSpacing = 1.02;
keyHeight = 70;
octaveWidth = keyWidth * 12 * widthSpacing;



/**
 * A single Fokker key (blue, white or black)
 * @param  {ctx} canvas context
 */
keyTemplate = (function(ctx) 
{
  function Key(note, yDisplacement)
  {
    this.note = note % 31;
    this.octave = Math.floor(note / 31);
    this.width = keyWidth;
    this.height = keyHeight;
    this.yDisplacement = yDisplacement;
    this.fillCol;
    this.isPressed = false;
    this.text = keyLabels[this.note];

    // console.log("note: " + this.note + "    oct: " + this.octave + " yDisplacement: " + this.yDisplacement);
  };

  Key.prototype.draw = function()
  {
    var octaveOffsetX = octaveWidth * this.octave  -  this.yDisplacement * this.width;
    var octaveOffsetY = -keyHeight * (this.octave + (this.yDisplacement * 2.5));
    var xpos = octaveOffsetX + xBorder + keyXpos[this.note] * this.width * widthSpacing;
    var ypos = octaveOffsetY + yBorder + Math.floor((5 - keyYpos[this.note]) * (this.height * 0.5));  // invert Y

    // COLOURS
    // change colour if pressed
    if (this.isPressed)   {  ctx.fillStyle = colPressed;            }
    else                  {  ctx.fillStyle = keyColours[this.note]; }
    
    ctx.strokeStyle = colBlack;
    if (keyColours[this.note] === colBlack)
    {
      ctx.strokeStyle = colWhite;
    }

    // outline and fill rectangles
    ctx.strokeRect(xpos, ypos, this.width, this.height);
    ctx.fillRect(xpos, ypos, this.width, this.height);
    ctx.strokeText(this.text, xpos + this.width*0.5, ypos + this.height * 0.55);
    
    // cvs.clearRect(45, 45, 60, 60);
  }

  Key.prototype.noteOn = function()   {    this.isPressed = true;  }
  Key.prototype.noteOff = function()   {    this.isPressed = false;  }

  return Key;
});


/// find the note and register given the index. Both return -1 if not a valid note
function getNoteAndRegister(xIndex, yIndex)
{
  // register remains -1 if it's outside any key bounds
  register = -1;
  note = -1;

  verticalAdjustment = 0;

  xOffset = noteXOffsets[xIndex];


  // are we before the vertical upstep within the octave?
  if (xIndex > 4)
  {
    verticalAdjustment = 1;
  }

    // are we on the leftmost vertical key line (behind x=0)
  if (xIndex == -1)
  {
    if (yIndex >= 7 && yIndex <= 12)
    {
      register = 1;
      note = Math.floor((yIndex-7) * 0.5);
    }
  }
  // are we on the black keys (in tersm of the lower register)
  else if (xPatternMap[xIndex] == 1)
  {
    // are we in the lower register?
    if (yIndex >= (1 + verticalAdjustment) && yIndex <= (4 + verticalAdjustment))
    {
      register = 0;
      yOffset = Math.floor((yIndex-(1+verticalAdjustment)) * 0.5);
      note = xOffset + yOffset;
    }
    // or the upper one?
    else if (yIndex >= (5 + verticalAdjustment) && yIndex <= (10 + verticalAdjustment))
    {
      register = 1;
      xOffset = noteXOffsets[xIndex+1];
      yOffset = Math.floor((yIndex-(5+verticalAdjustment)) * 0.5);
      note = xOffset + yOffset;
    }
  }
  // otherwise, we're on an even numbered line with a blue block at the bottom
  else
  {
    // lower register
    if (yIndex >= (0 + verticalAdjustment) && yIndex <= (5 + verticalAdjustment))
    {
      register = 0;
      yOffset = Math.floor((yIndex-verticalAdjustment) * 0.5);
      note = xOffset + yOffset;
    }
    // are we on the weird last one where blue and white is stacked on blue and white?
    else if (xIndex == 11)
    {
      if (yIndex >= (6 + verticalAdjustment) && yIndex <= (12 + verticalAdjustment))
      {
        // this is essentially in the octave above, so this is a fudge...
        register = 1;
        xOffset = noteXOffsets[0] + 31;
        yOffset = Math.floor((yIndex-(6+verticalAdjustment)) * 0.5);
        note = xOffset + yOffset;
      }
    }
    // are we on the other double bluewhite stack?
    else if (xIndex == 4)
    {
      if (yIndex >= (6 + verticalAdjustment) && yIndex <= (12 + verticalAdjustment))
      {
        // this is essentially in the octave above, so this is a fudge...
        register = 1;
        xOffset = noteXOffsets[xIndex+1];
        yOffset = Math.floor((yIndex-(6+verticalAdjustment)) * 0.5);
        note = xOffset + yOffset;
      }
    }
    // are we on the upper register black keys?
    else if (yIndex >= (6 + verticalAdjustment) && yIndex <= (9 + verticalAdjustment))
    {
      register = 1;
      xOffset = noteXOffsets[xIndex+1];
      yOffset = Math.floor((yIndex-(6+verticalAdjustment)) * 0.5);
      note = xOffset + yOffset;
    }
  }

  var noteAndRegister = new Array();
  noteAndRegister[0] = note;
  noteAndRegister[1] = register;
  return noteAndRegister;
}

/// Get Midi note from x y canvas position
function getNoteFromXY(x, y)
{
  note = -1;

  octave = Math.floor((x - xBorder) / octaveWidth);

  x = (x - xBorder) % octaveWidth;
  y += octave * keyHeight;

  // get integer indexes. xIndex=0 is octave 0, register 0, blue note
  // yIndex is doubled - so two for each key
  xIndex = Math.floor(x / (keyWidth * widthSpacing));
  yIndex = Math.floor(7 - ((y - yBorder) / (keyHeight * 0.5)));


  noteAndRegister = getNoteAndRegister(xIndex, yIndex);
  note = noteAndRegister[0];
  register = noteAndRegister[1];

  console.log("register: " + register  +  "    x: " + xIndex + " y: " + yIndex);

  // if we have a valid note, scale it by octave and register
  if (register != -1)
  {
    if (octave < 0) { octave = 0; }
    note = note + octave*31 + register*noteCount;
  }

  console.log("Final note: " + note);

  return note;
}

/// get mouse clicks in the canvas
function getMousePosition(canvas, event) 
{
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return getNoteFromXY(x, y);
}