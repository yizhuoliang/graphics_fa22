
rooms.example2D = function() {

lib2D();

description = 'Simple example of<br>interactive 2D.';

code = {
'explanation': `
  S.html(\`
     A 2D canvas lets you create paths.
     <p>
     You can either
     draw <i>strokes</i> along those paths or else
     create solid shapes by <i>filling</i> those paths.
  \`);
`,
init: `
  S.x = 400;
  S.y = 400;
`,
assets: `
  S.line = (ax,ay,bx,by) => {
     S.context.beginPath();
     S.context.moveTo(ax,ay);
     S.context.lineTo(bx,by);
     S.context.stroke();
  }

  S.rect = (x,y,w,h) => {
     S.context.beginPath();
     S.context.rect(x,y,w,h);

     S.context.strokeStyle = 'white';
     S.context.stroke();

     if (S.isSpace) {
        S.context.fillStyle = 'gray';
        S.context.fill();
     }
  }
`,
render: `

  let t = 100 * Math.sin(time);

  let c = S.context;

  c.lineWidth = 10;
  c.lineCap = 'round'; 

  let wx = 200;
  let wy = 100 + t;

  S.rect(wx, 0.8 * wy + 50, 2,2);
  S.rect(wx + 20, wy + 50, 2,2);
  S.rect(wx + 40, 1.2 * wy + 50, 2,2);
  S.rect(wx + 60, 1.4 * wy + 50, 2,2);
  S.rect(wx + 80, 1.6 * wy + 50, 2,2);
  S.rect(wx + 100,1.4 * wy + 50, 2,2);
  S.rect(wx + 120,1.2 * wy + 50, 2,2);
  S.rect(wx + 140, wy + 50, 2,2);
  S.rect(wx + 160, 0.8 * wy + 50, 2,2);

  // c.beginPath();
  // c.moveTo(100,100);
  // c.bezierCurveTo(wx,wy, 100,300, 200,300);
  // c.stroke();
`,
events: `
  onDrag = (x,y) => {
     S.x = x;
     S.y = y;
  }
  onKeyPress   = key => S.isSpace = key == 32;
  onKeyRelease = key => S.isSpace = false;
`
};

}

