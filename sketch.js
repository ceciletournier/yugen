let flock; // Objet qui contient les papillons/boid
let mic;  // Objet qui permet d'enregistrer le son du navigateur
let img = []; // Liste d'images qui vont apparaitre à l'écran

let initialBoid = 50; // nombre de papillon au chargement de la page
let immortalBoid = 15; // Nombre de papillon qui ne peuvent pas mourrir
let maximumBoid = 270; // nombre de papillon qui peuvent etre affiche sur la page

let micSensitivityTrigger = 0.1; // sensibilite du micro (plus c'est bas plus c'est sensible)

let boidsCanDie = true; // Active/désactive la mort automatique des papillons passé un certain délai

let clickGenerateBoids = true; // Permet d'activer/désactiver la génération de boid au click de souris

let randomCoordinates = true; // Permet d'activer/désactiver la génération des boids sur des coordonnées aléatoires
                              // si false, ils sont générés au centre de l'écran



// Function utilitaires de générations de coordonées aléatoires
function randomX() {
    return Math.floor(Math.random() * window.outerWidth);
}

function randomY() {
    return Math.floor(Math.random() * window.outerHeight);
}


// Chargement des images
function preload() {
    img.push(loadImage('assets/Forme-1.png'));
    img.push(loadImage('assets/Forme-2.png'));
    img.push(loadImage('assets/Forme-3.png'));
    img.push(loadImage('assets/Forme-4.png'));
    img.push(loadImage('assets/Forme-5.png'));
}

//Preparation de l'écran
function setup() {
    createCanvas(window.outerWidth, window.outerHeight, 'WEBGL');

    flock = new Flock();
    // Création de boids au chargement
    for (let i = 0; i < initialBoid; i++) {
        if (randomCoordinates) {
            flock.addBoid(new Boid(randomX(), randomY()));
        } else {
            flock.addBoid(new Boid(width / 2, height / 2));
        }
    }
    // Création des boids immortels
    for (let i = 0; i < immortalBoid; i++) {
        let b = new Boid(width / 2, height / 2, true);
        flock.addBoid(b);
    }

    // Ajout de l'enregistrement du son
    mic = new p5.AudioIn();
    mic.start();

}

// Function de mise à jour du dessin
function draw() {
    background(0); // Fond en noir
    flock.run(); // Deplacement des papillons

    // Verification du niveau sonore pour génération de papillons
    if (mic.getLevel() > micSensitivityTrigger) {
        if (randomCoordinates) {
            flock.addBoid(new Boid(randomX(), randomY()));
        } else {
            flock.addBoid(new Boid(width / 2, height / 2));
        }
    }
}

// Genere des papillons au clic glissé
function mouseDragged() {
    if (clickGenerateBoids) {
        flock.addBoid(new Boid(mouseX, mouseY));
    }
}

// Classe de gestion des boids
function Flock() {
    this.boids = [];
}

// Function de déplacement des papillons
Flock.prototype.run = function () {
    for (let i = 0; i < this.boids.length; i++) {
        this.boids[i].run(this.boids);
    }
    if (boidsCanDie) { // On verifie s'il ne faut pas faire disparaitre des papillons
        let now = new Date();
        this.boids = this.boids.filter(boid => !boid.deathDate || boid.deathDate > now);
    }
};

Flock.prototype.addBoid = function (b) {
    if (this.boids && this.boids.length < maximumBoid) {
        this.boids.push(b);
    }
};


// Classe boid
function Boid(x, y, immortal = false) {
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.r = 100;             // radius du papillon
    this.size = 120;             // taille de l'image
    this.maxspeed = 10;    // Vitesse maximum
    this.maxforce = 0.001; // Force pour la direction des papillons
    this.ttl = 60; // Duree de vie en secondes
    this.imgId = Math.floor((Math.random() * 10) % img.length);
    if (!immortal) {
        this.deathDate = ((ttl) => {
            var t = new Date();
            t.setSeconds(t.getSeconds() + ttl);
            return t;
        })(this.ttl);
    }
}

// Fonction de deplacement des boids
Boid.prototype.run = function (boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
};

Boid.prototype.applyForce = function (force) {
    this.acceleration.add(force);
};

// Calcul des vecteurs de separation, alignement et cohésion pour calculer le vecteur d'acceleration
// L'alignement et la cohésion a été désactivé car on ne veut pas que les papillons se regroupent
Boid.prototype.flock = function (boids) {
    let sep = this.separate(boids);   // Séparation
    //let ali = this.align(boids);      // Alignement désactivé
    //let coh = this.cohesion(boids);   // Cohésion désactivée
    // On donne un poids arbitraire à ces forces
    sep.mult(1.5);
    //ali.mult(1.0);
    //coh.mult(1.0);
    // On ajout ces forces au vecteur d'acceleration
    this.applyForce(sep);
    //this.applyForce(ali);
    //this.applyForce(coh);
};

// Methode de mise à jour de la position
Boid.prototype.update = function () {
    // Mise à jour de la velocité/vitesse
    this.velocity.add(this.acceleration);
    // Application de la limite de vitesse
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Remise à 0 de l'accéleration à chaque cycle
    this.acceleration.mult(0);
};

// Fonction de rendu graphique des boids
Boid.prototype.render = function () {
    let theta = this.velocity.heading() + radians(90);
    push();
    translate(this.position.x, this.position.y);
    rotate(theta);
    image(img[this.imgId], this.size, this.size, this.size, this.size);
    pop();
};

// Calcul de position si on sort de l'écran
Boid.prototype.borders = function () {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
};

// Separation
// Methode qui vérifie les boids adjacents afin de les éviter
Boid.prototype.separate = function (boids) {
    let desiredseparation = 25;
    let steer = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < desiredseparation)) {
            // Calcul du vecteur d'éloignement si un boid adjacent est trop près
            let diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d);
            steer.add(diff);
            count++;            // On compte le nombre de boid à éviter
        }
    }

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



/* Fonctionnalités desactivées */

// Alignement (Désactivé, puisque les papillons ne se déplacent plus en groupe)
// Pour chaque boid adjacent dans le système, calcule la vitesse moyenne
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

// Cohesion (Désactivé, puisqu'on ne veut pas que les papillons se déplacent en groupe)
// Calcule le vecteur de direction d'un boid pour pouvoir le regrouper avec d'autres boids
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

// Methode qui permet de calculer un vecteur afin qu'un boid puisse en rejoindre un autre et former un groupe
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
