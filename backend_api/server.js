const express = require('express')
const app = express()
const path = require('path')
// if we have a setup server port, it will pick it from the process.env file in the 
// server else use 3500 port
const PORT = process.env.PORT || 3500

// this will enable use serve image, css and other static files to view/html page
app.use('/', express.static(path.join(__dirname, '/public')))

app.use('/', require('./routes/root'))


app.listen(PORT, () => console.log(`Server is running on port... ${PORT}`))