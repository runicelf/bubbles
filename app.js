(function() {
  const wrapper = document.getElementById('wrapper');
  const canvas = document.getElementById('canvas'),
  context = canvas.getContext('2d');
  const button = document.getElementById('button');

  window.addEventListener('resize', resizeCanvas, false);
  function resizeCanvas() {
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    button.addEventListener('click', () => {
      bStore.addBall(new Circle(100, 280));
      bStore.showBall();
    });


    canvas.addEventListener('mousedown', event => {
      //console.log(event.pageX, event.pageY, circleExample.cords.y2());
      const ball = bStore.findBall(event.pageX, event.pageY);
      if(ball) {
        const onMoveWithBall = onMove.bind(null, ball);
        const onUpWithBall = onUp.bind(null, ball);
        let mouseCords = null;
        let vector;
        function onMove(ball, event) {
          if(mouseCords === null) {
            mouseCords = new Vector(event.pageX, event.pageY);
          }else {
            vector = new Vector(event.pageX, event.pageY).minus(mouseCords);
            mouseCords = new Vector(event.pageX, event.pageY);
          }
          ball.render(event.pageX, event.pageY);
        }
        function onUp(ball, event) {
          canvas.removeEventListener('mousemove',onMoveWithBall);
          canvas.removeEventListener('mouseup',onUpWithBall);
          ball.fly(vector, vector.length());
        }
        canvas.addEventListener('mousemove', onMoveWithBall);
        canvas.addEventListener('mouseup', onUpWithBall);
      }
      return;
    });
  }
  resizeCanvas();

  class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    plus(v) {
      //const normedV = this.normalize(v);
      return new Vector(this.x + v.x, this.y + v.y);
    }
    minus(v) {
      return new Vector(this.x - v.x, this.y - v.y);
    }
    multiply(n) {
      return new Vector(this.x * n, this.y * n);
    }
    reverseX() {
      return new Vector(this.x * -1, this.y);
    }
    reverseY() {
      return new Vector(this.x, this.y * -1);
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize(v) {
      const length = this.length(v)
      return new Vector(v.x * 1/length, v.y * 1/length);
    }
  }

  class Circle {
    constructor(x, y) {
      this.rad = this.randomRad();
      this.vector = new Vector(x, y);
      this.color = this.randomColor();
      this.cords = {
        x1 : () => this.vector.x - this.rad,
        y1 : () => this.vector.y - this.rad,
        x2 : () => this.vector.x + this.rad,
        y2 : () => this.vector.y + this.rad
      }
    }
    randomColor() {
      const r = Math.floor(Math.random() * (256));
      const g = Math.floor(Math.random() * (256));
      const b = Math.floor(Math.random() * (256));
      return(`rgb(${r},${g},${b})`);

    }
    randomRad() {
      return Math.floor(Math.random() * 40 + 10);
    }
    render(x = this.vector.x, y = this.vector.y, color = this.color) {
      this.vector.x = x;
      this.vector.y = y;
      const startTime = performance.now();
      function cbToFrame(color, time) {
        //if(startTime - time > 15) {
          context.clearRect(0, 0, canvas.width / 2, canvas.height)
          context.beginPath();
          context.arc(this.vector.x, this.vector.y, this.rad, 0, 2*Math.PI, false);
          context.fillStyle = color;
          context.fill();
          context.stroke();
        //}
      }
      requestAnimationFrame(cbToFrame.bind(this, color));
    }
    fly(vector, speed = 5) {
      //console.log(canvas.width, canvas.height);
      const cbToFrame = (vector, time) => {
        let insVector = vector.normalize(vector);
        const theyVector = vector.normalize(vector).multiply(speed);
        const newVector = this.vector.plus(theyVector);
        this.vector = newVector;
        //this.vector().multiply(speed);
        if(this.cords.y2() > canvas.height || this.cords.y1() < 0) {
          insVector = insVector.reverseY();
        }
        if(this.cords.x2() > canvas.width || this.cords.x1() < canvas.width / 2) {
          insVector = insVector.reverseX();
        }
        //context.clearRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
        context.beginPath();
        context.arc(this.vector.x, this.vector.y, this.rad, 0, 2*Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
        requestAnimationFrame(cbToFrame.bind(this, insVector));
      }
      requestAnimationFrame(cbToFrame.bind(this, vector));
      /*
      const cbToFrame = (x = this.x, y = this.y, time) => {
        let speedPlus = 0;
        this.x = x;
        this.y = y;
        if(this.cords.y2() === canvas.height || this.cords.y1() === 0) {
          speed *= -1;
        }
        if(this.cords.y2() + speed > canvas.height) {
          speedPlus = this.cords.y2() + speed - canvas.height;
          console.log(this.cords.y2() + speed , canvas.height)
        }
        if(this.cords.y1() + speed < 0) {
          speedPlus = this.cords.y1() + speed;
        }
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.beginPath();
        context.arc(this.x, this.y, this.rad, 0, 2*Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
       requestAnimationFrame(cbToFrame.bind(this, this.x , this.y + speed - speedPlus));
      }
      */
      //requestAnimationFrame(cbToFrame.bind(this, this.x , this.y + speed));
    }
    isYou(xCord, yCord) {
      if(xCord >= this.cords.x1() && xCord <= this.cords.x2() && yCord >= this.cords.y1() && yCord <= this.cords.y2()) {
        return true;
      }else {
        return false;
      }
    }
  }

  class BallStore {
    constructor() {
      this.store = []
    }
    addBall(b) {
      this.store.push(b);
    }
    findBall(x, y) {
      const ball = this.store.filter(b => b.isYou(x, y));
      if(ball.length > 0) {
        return ball[0];
      }
      return false;
    }
    showBall() {
      this.store[this.store.length - 1].render();
    }
  }

  const bStore = new BallStore();
  function clearScreen(time) {
    context.clearRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    requestAnimationFrame(clearScreen);
  }
  requestAnimationFrame(clearScreen);
  //circleExample.render();
  //context.re
  //circleExample.fly();
})();
