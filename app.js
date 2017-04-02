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
      bStore.addBall(new Circle(new Vector(100, 280)));
      bStore.showBall();
    });


    canvas.addEventListener('mousedown', event => {
      const ball = bStore.findBall(new Vector(event.pageX, event.pageY));
      if(ball) {
        const onMoveWithBall = onMove.bind(null, ball);
        const onUpWithBall = onUp.bind(null, ball);
        let mouseCords = null;
        let vector = new Vector(0.5, 0.5);
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
          ball.fly(vector.normalize(), vector.length());
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
      return new Vector(this.x + v.x, this.y + v.y);
    }
    minus(v) {
      return new Vector(this.x - v.x, this.y - v.y);
    }
    multiply(n) {
      return new Vector(this.x * n, this.y * n);
    }
    reverse() {
      return new Vector(this.x * -1, this.y * -1);
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
    normalize() {
      const length = this.length()
      return new Vector(this.x * 1/length, this.y * 1/length);
    }
  }

  class Circle {
    constructor(v) {
      this.rad = this.randomRad();
      this.vector = v;
      this.color = this.randomColor();
      this.listOfExternalEvents = [];
      this.state = {
        catched : false,
        widthOfSpace: 0
      };
      this.cords = {
        x1 : () => this.vector.x - this.rad,
        y1 : () => this.vector.y - this.rad,
        x2 : () => this.vector.x + this.rad,
        y2 : () => this.vector.y + this.rad
      };
      this.id = Circle.getId();

    }
    static getId() {
      let counter = 0;
      Circle.getId = () => {
        counter++;
        return counter;
      };
      return 0;
    };
    findCords(vector) {
      return {
        x1 : vector.x - this.rad,
        y1 : vector.y - this.rad,
        x2 : vector.x + this.rad,
        y2 : vector.y + this.rad
      }
    }
    addExternalEvent(e) {
      this.listOfExternalEvents.push(e);
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
          context.clearRect(0, 0, canvas.width / 2, canvas.height)
          context.beginPath();
          context.arc(this.vector.x, this.vector.y, this.rad, 0, 2*Math.PI, false);
          context.fillStyle = color;
          context.fill();
          context.stroke();
      }
      requestAnimationFrame(cbToFrame.bind(this, color));
    }
    fly(vector, speed = 5) {
      const cbToFrame = (vector, time) => {
        let insVector = vector;

        const theyVector = vector.multiply(speed);

        const newCords = this.findCords(this.vector.plus(theyVector));
        if(newCords.x1 > canvas.width / 2) {
          this.state.catched = true;
          this.state.widthOfSpace = canvas.width / 2;
        }
        if(this.listOfExternalEvents.length > 0) {
          insVector = this.vector.minus(this.listOfExternalEvents[0]).normalize();
          this.listOfExternalEvents = [];
        }else if(bStore.findBall(this.vector.plus(insVector.multiply(speed)), this.id)) {
          insVector = insVector.reverse();
        }

        if(newCords.y2 > canvas.height || newCords.y1 < 0) {
          insVector = insVector.reverseY();
        }
        if(newCords.x2 > canvas.width || newCords.x1 < this.state.widthOfSpace) {
          insVector = insVector.reverseX();
        }

        this.vector = this.vector.plus(insVector.multiply(speed));
        context.beginPath();
        context.arc(this.vector.x, this.vector.y, this.rad, 0, 2*Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
        requestAnimationFrame(cbToFrame.bind(this, insVector));
      }
      requestAnimationFrame(cbToFrame.bind(this, vector));
    }
    isYou(v) {
      if(v.x >= this.cords.x1() && v.x <= this.cords.x2() && v.y >= this.cords.y1() && v.y <= this.cords.y2()) {
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
    findById(id) {
      const ball = this.store.filter(b => b.id === id);
      if(ball.length > 0) {
        return ball[0];
      }else {
        console.log('errr');
        return false;
      }
    }
    findBall(v, id) {
      let ball;
      if (typeof id !== 'undefined') {
        ball = this.store.filter(b => b.id !== id && b.isYou(v));
        if(ball.length > 0) {
          const externalEvent = this.findById(id).vector;
          ball[0].addExternalEvent(externalEvent);
          return ball[0];
        }
        return  false;
      }else {
        ball = this.store.filter(b => b.isYou(v));
      }
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
})();
