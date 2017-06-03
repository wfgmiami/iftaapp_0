const express = require('express');
const app = express();
const router = require('./routes');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use('/vendor', express.static(__dirname + '/node_modules'));
app.use('/dist', express.static(__dirname + '/dist'));
app.use('/stylesheets', express.static(__dirname + '/stylesheets'));

app.get('/', (req,res,next) => {
	res.sendFile(__dirname + '/index.html');
})

app.use('/api', router);

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`listening on port ${port}`));


