const express = require('express')
const connectDB = require('./config/db')
const app = express()
const PORT = process.env.PORT || 5000

//Connect database
connectDB()

//Init Middleware
app.use(express.json({extended: false}))

app.get('/', ((req, res) => res.send('API running')))

//Define Routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/profile', require('./routes/api/profile'))
app.use('/api/order', require('./routes/api/order'))

app.listen(PORT, () => console.log(`Server start on port ${PORT}`))