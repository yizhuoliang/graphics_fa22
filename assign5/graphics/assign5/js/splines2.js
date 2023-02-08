
rooms.splines2 = function() {

lib2D();

description = 'More about splines.';

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

  S.keys = [
     {x:100, y:100, z:100},
     {x:200, y:100, z:0},
     {x:100, y:200, z:0},
     {x:200, y:200, z:0},
  ];
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

  let BezierMatrix = [
     -1, 3,-3, 1,
      3,-6, 3, 0,
     -3, 3, 0, 0,
      1, 0, 0, 0,
  ];

  let HermiteMatrix = [
      2,-3, 0, 1,
     -2, 3, 0, 0,
      1,-2, 1, 0,
      1,-1, 0, 0,
  ];

  let CatmullRomMatrix = [
     -1/2,  1  , -1/2, 0,
      3/2, -5/2,  0  , 1,
     -3/2,  2  ,  1/2, 0,
      1/2, -1/2,  0  , 0,
  ];

  let BSplineMatrix = [
     -1/6, 3/6,-3/6, 1/6,
      3/6,-6/6, 0/6, 4/6,
     -3/6, 3/6, 3/6, 1/6,
      1/6, 0/6, 0/6, 0/6,
  ];

  let evalCubicSpline = (splineMatrix, P, t) => {
     let splineValue = P => {
        let C = matrixTransform(splineMatrix, P);
	return t*t*t * C[0] + t*t * C[1] + t * C[2] + C[3];
     }

     // THE VALUE AT A KEY CAN BE EITHER A NUMBER OR AN OBJECT

     if (Number.isFinite(P[0]))    // SPECIAL CASE: THE VALUE
        return splineValue(P);     // AT THE KEY IS A NUMBER.

     let value = {};
     for (let k in P[0])
        value[k] = splineValue([ P[0][k], P[1][k], P[2][k], P[3][k] ]);
	                   // eg:  a.x      b.x      c.x      d.x
     return value;
  }

  S.CatmullRomFunction = (keys, n, t) => {
     let mm = n => Math.max(0, Math.min(keys.length - 1, n));
     let a = keys[mm(n-1)];
     let b = keys[mm(n  )];
     let c = keys[mm(n+1)];
     let d = keys[mm(n+2)];
     return evalCubicSpline(CatmullRomMatrix, [a,b,c,d], t);
  }

  S.BSplineFunction = (keys, n, t) => {
     let mm = n => Math.max(0, Math.min(keys.length - 1, n));
     let a = keys[mm(n-1)];
     let b = keys[mm(n  )];
     let c = keys[mm(n+1)];
     let d = keys[mm(n+2)];
     return evalCubicSpline(BSplineMatrix, [a,b,c,d], t);
  }

  S.BezierFunction = (keys, n, t) => {
     let mm = n => Math.max(0, Math.min(keys.length - 1, n));
     let a = keys[mm(3*n  )];
     let b = keys[mm(3*n+1)];
     let c = keys[mm(3*n+2)];
     let d = keys[mm(3*n+3)];
     return evalCubicSpline(BezierMatrix, [a,b,c,d], t);
  }

  S.splineFunction = S.BezierFunction;

  S.evalSpline = (keys, f, splineFunction) => {
     let T;
     if (splineFunction == S.BezierFunction)
        T = Math.max(0, Math.min(.999, f)) * (keys.length/3);
     else
        T = Math.max(0, Math.min(.999, f)) * (keys.length - 1);
     return splineFunction(keys, T >> 0, T % 1);
  }
`,
render: `

  let c = S.context;

  c.lineWidth = 3;
  c.lineCap = 'round'; 

  // DRAW THE SPLINE CURVE

  c.beginPath();
  for (let f = 0 ; f <= 1 ; f += 1/100) {
     let p = S.evalSpline(S.keys, f, S.splineFunction);
     c.lineTo(p.x, p.y);
  }
  c.stroke();

  if (! S.isSpace) {

     // DRAW THE KEYS

     for (let n = 0 ; n < S.keys.length ; n++)
        S.rect(S.keys[n].x - 3, S.keys[n].y - 3, 6, 6);

     // IF BEZIER, DRAW THE GUIDE LINES

     if (S.splineFunction == S.BezierFunction) {
        c.lineWidth = 1;
        for (let n = 0 ; n < S.keys.length-1 ; n++)
           S.line(S.keys[n].x, S.keys[n].y, S.keys[n+1].x, S.keys[n+1].y);
     }
  }

  // ANIMATE ALONG THE SPLINE CURVE

  let f = (time / 3) % 1;
  let p = S.evalSpline(S.keys, f, S.splineFunction);
  S.rect(p.x - 15, p.y - 15, 30, 30);
`,
events: `

  let makeCollinear = (i,j,k) => {
     let xi = S.keys[i].x, yi = S.keys[i].y;
     let xj = S.keys[j].x, yj = S.keys[j].y;
     let xk = S.keys[k].x, yk = S.keys[k].y;
     let dij = Math.sqrt((xj-xi)*(xj-xi) + (yj-yi)*(yj-yi));
     let djk = Math.sqrt((xk-xj)*(xk-xj) + (yk-yj)*(yk-yj));
     S.keys[i].x = xj + (xj - xk) * dij / djk;
     S.keys[i].y = yj + (yj - yk) * dij / djk;
  }

  onPress = (x,y) => {

     // FIND WHAT KEY, IF ANY, IS AT THE CURSOR

     S.n = -1;
     S.dragged = false;
     for (let n = 0 ; n < S.keys.length ; n++)
        if ( x >= S.keys[n].x - 10 && x < S.keys[n].x + 10 &&
             y >= S.keys[n].y - 10 && y < S.keys[n].y + 10 )
           S.n = n; 
  }

  onDrag = (x,y) => {

     // DRAG ON A KEY TO MOVE IT

     S.dragged = true;
     if (S.n >= 0) {
        let dx = x - S.keys[S.n].x;
        let dy = y - S.keys[S.n].y;

        S.keys[S.n].x = x;
        S.keys[S.n].y = y;

	if (S.splineFunction == S.BezierFunction) {
	   switch (S.n % 3) {
	   case 0:
	      if (S.n > 0) {
	         S.keys[S.n-1].x += dx;
	         S.keys[S.n-1].y += dy;
	      }
	      if (S.n < S.keys.length - 1) {
	         S.keys[S.n+1].x += dx;
	         S.keys[S.n+1].y += dy;
	      }
	      break;
	   case 1:
	      if (S.n > 1)
	         makeCollinear(S.n-2, S.n-1, S.n);
              break;
           case 2:
	      if (S.n < S.keys.length-2)
	         makeCollinear(S.n+2, S.n+1, S.n);
	      break;
	   }
	}
     }
  }

  onRelease = (x,y) => {
     if (! S.dragged)

        // CLICK ON A KEY TO DELETE IT

        if (S.n >= 0)
           S.keys.splice(S.n, 1);

        // CLICK ON BACKGROUND TO APPEND A KEY

        else
	   if (S.splineFunction == S.BezierFunction) {
	      let xn = S.keys[S.keys.length-1].x;
	      let yn = S.keys[S.keys.length-1].y;
              S.keys.push({x: 2/3*xn + 1/3*x, y: 2/3*yn + 1/3*y});
              S.keys.push({x: 1/3*xn + 2/3*x, y: 1/3*yn + 2/3*y});
              S.keys.push({x:x, y:y});
	      makeCollinear(S.keys.length-3, S.keys.length-4, S.keys.length-5);
	   }
	   else
              S.keys.push({x:x, y:y});
  }

  onKeyPress   = key => S.isSpace = key == 32;
  onKeyRelease = key => S.isSpace = false;
`
};

}

