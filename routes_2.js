const router = require('express').Router();
const getRoute = require('request');
const decodePoints = require('./db').decodePoints;
const getStateMiles = require('./db').getStateMiles;

router.get('/',(req,res,next)=>{
	//console.log('hit api route',req.query[0]);

	getRoute(req.query[0], (error, response, body) => {
		if(!error && response.statusCode == 200){
			let points = decodePoints(body); 
			//console.log(points);
			getStateMiles(points, (error, stateMiles) => {
				if(!err) res.json(stateMiles)
				else console.log('error in getStateMiles') 	
			})
			
		}else{
			console.log('error in getRoute routes.js');
			res.statusCode(403);
		}
 	})
})


module.exports = router;
