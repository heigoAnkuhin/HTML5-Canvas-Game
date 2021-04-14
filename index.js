const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scoreEl = document.querySelector('#ScoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEl = document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')
const shotsEl = document.querySelector('#shotsEl')

var bgMusic

// Mängija
class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0,
             Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
}

// Rakett
class Projectile {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0,
             Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x  + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

// Vaenlane
class Enemy {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0,
             Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x  + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

// Lendavad osakesed
const friction = 0.99
class Particle {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0,
             Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x  + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}

const x = canvas.width / 2
const y = canvas.height / 2
let player = new Player(x, y, 15, 'deeppink')
let projectiles = []
let enemies = []
let particles = []

// Mängu alustades muutujate eelväärtustamiseks
function init() {
    player = new Player(x, y, 15, 'deeppink')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
    shots = 0
    shotsEl.innerHTML = shots
    bgMusic = new sound("background.mp3")
    bgMusic.play()
}

// Vastaste tekitamiseks
function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (40 - 4) + 4
        let x
        let y
        let speed
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ?  0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
            speed = 2.25                 
        }
        else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ?  0 - radius : canvas.height + radius
            speed = 1.5 
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        }

        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 1000)
}

// Elementide joonistamine
let animationId
let score = 0
function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()
    particles.forEach((particle, pIndex) => { // osakesed
        if (particle.alpha <= 0) {
            particles.splice(pIndex, 1)
        }
        else {
            particle.update()
        }
    })

    projectiles.forEach((projectile, index) => { // raketid
        projectile.update()

        if (
            projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
            )  {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })

    enemies.forEach((enemy, index) => { // vaenlased
        enemy.update()
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // Kui vaenlane ja mängija puutuvad kokku 
        if (dist - enemy.radius - player.radius < 1) {
            // Animatsioon peatatakse ja skoorid salvestatakse,
            // mäng lõppeb ning kuvatakse lõpuekraan
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
            shotsEl.innerHTML = shots - 1
            bgMusic.stop()
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            // Kui vaenlane saab pihta raketiga
            if (dist - enemy.radius - projectile.radius < 1) {

                for (let i=0; i < enemy.radius * 2; i++) { // tekitame lendlevad osakesed
                    particles.push(new Particle(
                        projectile.x, 
                        projectile.y,
                        Math.random() * 2, 
                        enemy.color, 
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 10), 
                            y: (Math.random() - 0.5) * (Math.random() * 10)
                        })
                    )
                }
                
                // Kui vaenlane on raadiuselt suur
                if (enemy.radius - 10 > 5) {
                    // Vastavad punktid koos animeeritud skoorivahetusega
                    scoreEl.style.opacity = 0
                    setTimeout(() => {
                        score += 100
                        scoreEl.innerHTML = score
                        scoreEl.style.opacity = 1
                    }, 250)

                    gsap.to(enemy, { // Suur vaenlane muutub väiksemaks
                        radius: enemy.radius - 10
                    })
                    enemy.radius -= 10
                    // Rakett kaob
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                }
                else { // Kui vaenlane on raadiuselt väike
                    scoreEl.style.opacity = 0
                    // Vastavad punktid koos animeeritud skoorivahetusega
                    setTimeout(() => {
                        score += 500
                        scoreEl.innerHTML = score
                        scoreEl.style.opacity = 1
                    }, 250)
                    // Vaenlane ja rakett kaovad
                    setTimeout(() => {
                        enemies.splice(index, 1)
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                }
            }
        })
    })
}

// Taustaheli mängimise jaoks funktsioon
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }    
}

 // Hiirekliki registreerimine
let shots = 0
addEventListener('click', (event) => {
    shots += 1
    shots.innerHTML = shots
    const angle = Math.atan2(event.clientY - (canvas.height / 2), event.clientX - (canvas.width / 2))
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile (
        canvas.width / 2,
        canvas.height / 2,
        4,
        'deeppink',
        velocity
    ))


})

// Start Game nupp
startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalEl.style.display = 'none'
})