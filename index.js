const express = require('express')
const path = require('path');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const session = require('express-session')
const flash = require('connect-flash')
process.env.TZ = 'Asia/Jakarta'
const router = require('./router')

const app = express()
dotenv.config()
const PORT = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(cookieParser())
app.use(helmet())
app.use(session({
    secret: 'm0N1t0r1ng-5kr1p51-53Cr3t',
    resave: false,
    saveUninitialized: false,
    cookie: { expires: 10000 }
}))
app.use(flash())
// app.use(cors())
app.set('view engine', 'ejs')
app.use(express.static('public'))


app.use(router)

app.use('/', async (req, res) => {
    try {
        res.status(404).render('404')
    } catch (error) {
        res.status(500).json({
            status: 500,
            msg: error.message
        })
    }
})

app.listen(PORT, async () => {
    try {
        console.log(`Server listening on http://127.0.0.1:${PORT}`);
    } catch (error) {
        console.log(error);
    }
})

