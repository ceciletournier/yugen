let flock;

let mic;

let initialBoid = 50; // nombre de papillon au chargement de la page
let immortalBoid = 15; // Nombre de papillon qui ne peuvent pas mourrir
let maximumBoid = 250; // nombre de papillon qui peuvent etre affiche sur la page

let micSensitivityTrigger = 0.01; // sensibilite du micro (plus c'est bas plus c'est sensible)

let boidsCanDie = true;

let clickGenerateBoids = true;

let randomCoordinates = true;

let img = [];

function randomX() {
    return Math.floor(Math.random() * window.outerWidth) % window.outerWidth;
}

function randomY() {
    return Math.floor(Math.random() * window.outerHeight) % window.outerHeight;
}

function preload() {
    img.push(loadImage('assets/Forme-1.png'));
    img.push(loadImage('assets/Forme-2.png'));
    img.push(loadImage('assets/Forme-3.png'));
    img.push(loadImage('assets/Forme-4.png'));
    img.push(loadImage('assets/Forme-5.png'));
}

function setup() {
    createCanvas(window.outerWidth, window.outerHeight);

    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < initialBoid; i++) {
        if (randomCoordinates) {
            flock.addBoid(new Boid(randomX(), randomY()));
        } else {
            flock.addBoid(new Boid(width / 2, height / 2));
        }
    }
    for (let i = 0; i < immortalBoid; i++) {
        let b = new Boid(width / 2, height / 2, true);
        flock.addBoid(b);
    }


    mic = new p5.AudioIn();
    mic.start();

}

function draw() {
    background(0);
    flock.run();
    if (mic.getLevel() > micSensitivityTrigger) {
        if (randomCoordinates) {
            flock.addBoid(new Boid(randomX(), randomY()));
        } else {
            flock.addBoid(new Boid(width / 2, height / 2));
        }
    }
}

// Add a new boid into the System
function mouseDragged() {
    if (clickGenerateBoids) {
        flock.addBoid(new Boid(mouseX, mouseY));
    }
}

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
    // An array for all the boids
    this.boids = []; // Initialize the array
}

Flock.prototype.run = function () {
    for (let i = 0; i < this.boids.length; i++) {
        this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
    }
    if (boidsCanDie) {
        let now = new Date();
        this.boids = this.boids.filter(boid => !boid.deathDate || boid.deathDate > now);
    }
};

Flock.prototype.addBoid = function (b) {
    if (this.boids && this.boids.length < maximumBoid) {
        this.boids.push(b);
    }
};

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y, immortal = false) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.r = 100;             // Size Radius
    this.size = 100;             // Size Image
    this.maxspeed = 10;    // Maximum speed
    this.maxforce = 0.001; // Maximum steering force
    this.ttl = 60; // duree de vie en secondes
    this.imgId = Math.floor((Math.random() * 10) % img.length);
    if (!immortal) {
        this.deathDate = ((ttl) => {
            var t = new Date();
            t.setSeconds(t.getSeconds() + ttl);
            return t;
        })(this.ttl);
    }
}

Boid.prototype.run = function (boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
};

Boid.prototype.applyForce = function (force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
};

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
    let sep = this.separate(boids);   // Separation
    //let ali = this.align(boids);      // Alignment
    //let coh = this.cohesion(boids);   // Cohesion
    // Arbitrarily weight these forces
    sep.mult(1.5);
    //ali.mult(1.0);
    //coh.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    //this.applyForce(ali);
    //this.applyForce(coh);
};

// Method to update location
Boid.prototype.update = function () {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
};

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
    let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);  // Limit to maximum steering force
    return steer;
};

Boid.prototype.render = function () {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    fill(255);
    stroke(255);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    /*beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);*/
    image(img[this.imgId], this.size, this.size, this.size, this.size);
    pop();
};

// Wraparound
Boid.prototype.borders = function () {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
};

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
    let desiredseparation = 25; //25
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ((d > 0) && (d < desiredseparation)) {
            // Calculate vector pointing away from neighbor
            let diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d);        // Weight by distance
            steer.add(diff);
            count++;            // Keep track of how many
        }
    }
    // Average -- divide by how many
    if (count > 0) {
        steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
    }
    return steer;
};

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        let steer = p5.Vector.sub(sum, this.velocity);
        steer.limit(this.maxforce);
        return steer;
    } else {
        return createVector(0, 0);
    }
};

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].position); // Add location
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        return this.seek(sum);  // Steer towards the location
    } else {
        return createVector(0, 0);
    }
};


