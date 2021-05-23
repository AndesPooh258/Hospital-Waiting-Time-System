const express = require("express");
const jwt = require("jwt-simple");
const bodyParser = require("body-parser");
const { text } = require("body-parser");
const cookieParser = require("cookie-parser");
const nodeFetch = require("node-fetch");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname));
// to-do: replace with your server's port
const server = app.listen(2104);

// to-do: replace with your database's name and password
mongoose.connect("mongodb://s1155xxxxxx:password@localhost/s1155xxxxxx");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function(){
	console.log("Connection is open...");
});

let PlaceSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    latitude : { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    telephone: { type: String },
    comments: [ { type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
});

let UserSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, require: true },
    administrator: { type: Boolean, required: true },
    favPlaces: [ { type: mongoose.Schema.Types.ObjectId ,ref: "Place" } ]
});

let CommentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    message: { type: String, required: true }
});

let Place = mongoose.model('Place', PlaceSchema);
let User = mongoose.model("User", UserSchema);
let Comment = mongoose.model('Comment', CommentSchema);

/* initialization endpoint */
/* app.get("/admin", (req, res)=>{
	let name = "admin";
	let password = "admin";
    let administrator = true;
    let favPlaces = null;

	// use synchronous version of bcrypt
	let salt = bcrypt.genSaltSync(saltRounds);
	password = bcrypt.hashSync(password, salt);

	formData = {"name": name, "password": password, "administrator": administrator};
	if(favPlaces) formData.favPlaces = favPlaces;
	
	User.create(formData, (err,r)=>{
		if(err) {res.json({"failed": "DB error."}); return;}  
			res.json({"status":1, "name":6});
		return; 
	});
}); */

app.get("/reload", (req, res)=>{

	var Place_data = [{name: "Alice Ho Miu Ling Nethersole Hospital", latitude: 22.4586244,longitude: 114.173876},
	{name: "Caritas Medical Centre", latitude: 22.3414653,longitude: 114.1510029},
	{name: "Kwong Wah Hospital", latitude: 22.3151818,longitude: 114.1702247},
	{name: "North District Hospital", latitude: 22.4968697,longitude: 114.1225021},
	{name: "North Lantau Hospital", latitude: 22.2820281,longitude: 113.937082},
	{name: "Princess Margaret Hospital", latitude: 22.341361,longitude: 114.1316326},

	{name:"Pok Oi Hospital", latitude:22.44542494133629, longitude: 114.04195884394926},
	{name:"Prince of Wales Hospital", latitude:22.379287531636926, longitude: 114.20143602030679},
	{name:"Pamela Youde Nethersole Eastern Hospital", latitude:22.269616839865204, longitude: 114.2363259648367},
	{name:"Queen Elizabeth Hospital", latitude:22.30890522596123, longitude: 114.17465873895006},
	{name:"Queen Mary Hospital", latitude:22.270205026052036, longitude: 114.13116087170329},
	{name:"Ruttonjee Hospital", latitude:22.275856596537803, longitude: 114.17533241889078},

	{name:"Yan Chai Hospital", latitude:22.369744596335977,longitude: 114.11959646327249},
	{name: "United Christian Hospital", latitude:22.32324831826011, longitude:114.22700783114387},
	{name:"Tin Shui Wai Hospital", latitude:22.45848576365104, longitude:113.99584006112342  },
	{name:"Tuen Mun Hospital", latitude: 22.407763369180877, longitude: 113.97561235377019},
	{name:"Tseung Kwan O Hospital", latitude:22.318450556794573, longitude: 114.2697389517659},
	{name: "St John Hospital", latitude:22.208093109523606 , longitude: 114.03151380194268}
	];

	var details = [{address:"11 Chuen On Road, Tai Po, N.T.", telephone:"26892000"},
	{address:"111 Wing Hong Street, Sham Shui Po, KLN", telephone:"34085678"},
	{address:"Kwong Wah Hospital, 25 Waterloo Road, Yaumatei, Kowloon, Hong Kong", telephone:"23322311"},
	{address:"North District Hospital, 9 Po Kin Road, Sheung Shui, New Territories", telephone:"26838888"},
	{address:"8 Chung Yan Road, Tung Chung, Lantau Island", telephone:"34677000"},
	{address:"2-10 Princess Margaret Hospital Road, Lai Chi Kok, Kowloon", telephone:"29901111"},

	{address:"Au Tau, Yuen Long, N.T.", telephone:"24868000"},
	{address:"30-32 Ngan Shing Street, Shatin, NT", telephone:"35052211"},
	{address:"3 Lok Man Road, Chai Wan, HK", telephone:"25957920"},
	{address:"30 Gascoigne Rd, Yau Ma Tei", telephone:"35068888"},
	{address:"102 Pok Fu Lam Road, HK", telephone:"22553838"},
	{address:"266 Queen's Road East, Wan Chai, HK", telephone:"22912000"},

	{address: "7-11, Yan Chai St, Tsuen Wan", telephone: "24178383"},
	{address:"130 Hip Wo St, Kwun Tong", telephone:"23799611"},
	{address:"11 Tin Tan St, Tin Shui Wai", telephone: "35135000"},
	{address: "Block H, Tsing Chung Koon Rd, Tuen Mun", telephone:"24685111"},
	{address:"2 Po Ning Ln, Tseung Kwan O", telephone:"22080111"},
	{address:"Cheung Chau Hospital Rd, Cheung Chau", telephone:"29819441"}
	];

	if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");
	
    User.findOne({name: login.name}, (err, result)=>{
        if(err){
            res.json({"failed": "DB error."});
            return;
        }
        if(result == null){
            res.json({"failed": "Data not found."});
            return;
        }
        if(result.administrator == false){
            res.json({"failed": "You are not administrator."});
            return;
        }
        else{
			let data=[];
			for(var counter=0; counter<details.length; counter++){
				data[counter] = {...Place_data[counter], ...details[counter]};
			}
			
			Place.find({}, (err, result)=>{
				if(err){
					res.json({"failed": "DB error."});
					return;
				}
				for(p of data){
					for(var i=0; i < result.length; i++){
						if(p.name == result[i].name)
							break;
					}
					Place.create(p, (err, res)=>{})
				}
			});
			res.json({"success": "Reloaded."});
        }
    });
});

app.get("/refresh", (req,res)=>{
    nodeFetch("http://www.ha.org.hk/opendata/aed/aedwtdata-en.json").then((data)=>data.text()).then((text)=>{
        res.send(text);
    });
});

/* authentication endpoints */
app.get("/auth",(req, res)=>{
	if(req.cookies.Login){
		let login = jwt.decode(req.cookies.Login, "Login");
		User.findOne({"name": login.name}, (err, data)=>{
			if (data){
				res.json({"name":data.name, "administrator": data.administrator});
			} else res.json({"failed": "Not authenticated."});
		});
	} else res.json({"failed": "Not authenticated."});
});

app.post("/login", (req,res,next)=>{

    // front notification
    let username = req.body["username"];
    let userpassword = req.body["password"];
    
    if(username == null) username="";
    if(userpassword == null) userpassword="";
    
    if(username == "" || userpassword == ""){
        res.json({"failed":"Empty user name or user password."});
        return;
    }

    User.findOne({name: username}, (err, data)=>{
        // show an error page in front end
        if(err){
            res.json({"failed": "DB Error."});
            return;
        }

        if(data == null){
            res.json({"failed": "Data not found."});
            return;
        }
        else{
            if(!bcrypt.compareSync(userpassword, data.password)){
                 res.json({"failed": "Wrong password."});
                 return;
            }

            let payload = {Login: true, name: username};
            let secret = "Login";
            token = jwt.encode(payload, secret);
            res.cookie("Login", token, {maxAge: 30000000});
            res.json({"success": true, "name": data.name, "administrator": data.administrator});

        }
    });
});

app.post("/logout", (req,res)=>{
    res.clearCookie("Login");
    res.json({"success": true});
    return; 
});

/* general endpoints */
app.get("/places", (req, res)=>{

    // check if cookie exists
    if(req.cookies.Login == null){
        res.json({"failed": "No Cookies."});
        return;
    }

    // check login
    let login = jwt.decode(req.cookies.Login, "Login");

    if(login.Login){
        // Sort name in accecding order by default
        Place.find({}).sort({name: 1}).exec((err, data)=>{
            if(err){
                //  
                res.json({"failed": "DB error."});
                return;
            }
            res.send(data);
            return;
        });
    }
    else{
        res.json({"failed": "Have not login."});
        return;
    }
});

app.get("/users", (req, res)=>{

    // check if cookie exists
    if(req.cookies.Login == null){
        res.json({"failed": "No Cookies."});
        return;
    }

    // check login
    let login = jwt.decode(req.cookies.Login, "Login");

    // Sort name in accecding order by default
    User.find({}).sort({name: 1}).exec((err, data)=>{
        if(err){
            res.json({"failed": "DB error."});
            return;
        }
        res.send(data);
        return;
    });
});

app.get("/comment", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // tell front end the name of variables
    let id = req.query['id'];

    Comment.findOne({"_id": id}, (err, data)=>{
        if(err) {res.json({"failed": "DB error."}); return;}
		if(data){
			User.findOne({"_id": data.user}, (err, userdata)=>{
				if(err) {res.json({"failed": "DB error."}); return;}
				if(userdata)
					res.send({"username": userdata.name, "message": data.message});
				else res.send({"username": "Old User", "message": data.message});
			});
		} else {res.json({"failed": "DB error."}); return;}
		return;
    });
});

app.post("/comment", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // tell front end the name of variables
    let message = req.body["message"];
    let placename = req.body["placename"];

    // Find user's object id first, then create comment, then insert to Place
    User.findOne({"name": login.name}, (err, data)=>{
        if(err) {res.json({"failed": "DB error."}); return;}
        
        Comment.create({"user": data._id, "message": message}, (err,r)=>{
            if(err) {res.json({"failed": "DB error."}); return;}
    
            let objid = r._id;
            Place.findOneAndUpdate({"name": placename}, {$push: {comments: objid}}, {new: true},(err, data)=>{
                if(err){
                    //  
                    res.json({"failed": "DB error."});
                    return;
                }
                res.send(data);
            });
            return; 
        });
    });
});

app.get("/checkfav", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No Cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");
	let id = req.query['id'];

    User.findOne({"name": login.name}).populate("favPlaces").exec((err,data)=>{
        if(err){ 
            res.json({"failed": "DB error."});
            return;
        }
		if (data && data.favPlaces){
			for (i = 0; i < data.favPlaces.length; i++){
				if (id == data.favPlaces[i]._id){
					res.json({"fav": true});
					return;
				}
			}
		}
		res.json({"fav": false});
    });
});

app.get("/favPlace", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No Cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    User.findOne({"name": login.name}).populate("favPlaces").exec((err,data)=>{
        if(err){
            res.json({"failed": "DB error."});
            return;
        }
        res.send(data.favPlaces);
    });
});

app.post("/favPlace", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // front end sends the place name to us
    let placename = req.body["placename"];

    Place.findOne({"name": placename}, (err, data)=>{
        let objid = data._id;
        
        User.findOne({"name": login.name}, (err, data)=>{
            let exist = false;
           
            for(i of data.favPlaces){
                // i is an object. Turn it to string for comparison
                i = JSON.stringify(i);
                
                if(i == JSON.stringify(objid)){
                    exist = true;
                    break;
                }
            }
            if(!exist){
                User.findOneAndUpdate({"name": login.name}, {$push: {favPlaces: objid}}, {new: true}, (err, data)=>{
                    if(err){
                        res.json({"failed": "DB error."});
                        return;
                    }
                    res.send(data);
                });
                
            }
            else{
                res.send("not updated");
            }
        });
    });
});

app.delete("/favPlace", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // front end sends the place name to us
    let placename = req.body["placename"];

    Place.findOne({"name": placename}, (err, data)=>{
        let objid = data._id;
    
        User.findOne({"name": login.name}, (err, data)=>{
            let exist = false;
           
            for(i of data.favPlaces){
                // i is an object. Turn it to string for comparison
                i = JSON.stringify(i);
                
                if(i == JSON.stringify(objid)){
                    exist = true;
                    break;
                }
            }
            if(exist){
                User.findOneAndUpdate({"name": login.name}, {$pull: {favPlaces:objid}}, {new: true}, (err, data)=>{
                    if(err){
                        //  
                        res.json({"failed": "DB error."});
                        return;
                    }
                    res.send(data);
                });
                
            }
            else{
                res.json({"failed": "This is not a FavPlace."});
            }
        });
    });
});

app.post("/create", (req, res)=>{

    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // tell front end
    let type = req.body["type"];
    let formData = {};
    if(type == "place"){
        let name = req.body["name"];
        let latitude = req.body["latitude"];
        let longitude = req.body["longitude"];
        let address = req.body["address"];
        let telephone = req.body["telephone"];
        let comments = req.body["comments"]; 

        // name, latitude and longitude are required
        if(name == null) name="";
        if(latitude == null) latitude="";
        if(longitude == null) longitude="";

        
        if(name == "" || latitude == "" || longitude == ""){
            res.json({"failed": "Name or latitude or longitude missing."});
            return;
        }
        formData = {"name": name, "latitude": latitude, "longitude": longitude};
        if(comments) formData.comments = comments;
        if(address) formData.address = address;
        if(telephone) formData.telephone = telephone;
    }
    else if(type == "user"){
        let name = req.body["name"];
        let password = req.body["password"];
        let administrator = req.body["administrator"];
        let favPlaces = req.body["favPlaces"]; 

        // name, latitude and longitude are required
        if(name == null) name="";
        if(password == null) password="";
        if(administrator == null) administrator="";
        
        if(name == "" || password == "" || administrator == ""){
            res.json({"failed": "Name or password or administrator missing."});
            return;
        }

        // use synchronous version of bcrypt
        let salt = bcrypt.genSaltSync(saltRounds);
        password = bcrypt.hashSync(password, salt);

        formData = {"name": name, "password": password, "administrator": administrator};
        if(favPlaces) formData.favPlaces = favPlaces;
        
    } 
    
    User.findOne({name: login.name}, (err, data)=>{
        // show an error page in front end
        if(err){
            res.json({"failed": "DB error."});
            return;
        }

        if(data == null){
            res.json({"failed": "Data not found."});
            return;
        }
        if(data.administrator == false){
            res.json({"failed": "You are not administrator."});
            return;
        }
        else{
            if(type == "place"){
                Place.create(formData, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.json({"status":1, "name":5});
                    return; 
                });
            }
            else if(type == "user"){
                User.create(formData, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.json({"status":1, "name":6});
                    return; 
                });
            }
        }
    });
});

app.put("/update", (req, res)=>{
    if(req.cookies.Login == null){
        res.json({"failed": "No cookies."});
        return;
    }

    let login = jwt.decode(req.cookies.Login, "Login");

    // check if the user is admin
    User.findOne({"name": login.name}, (err, data)=>{
        if(err){
            res.json({"failed": "DB error."});
            return;
        }

        if(data == null){
            res.json({"failed": "Data not found."});
            return;
        }

        if(data.administrator){
            let type = req.body["type"];
            let formData = {$set:{}};
            let name = req.body["name"];
            let updatename = req.body["updatename"];
			let administrator = req.body["administrator"];
            let latitude = req.body["latitude"];
            let longitude = req.body["longitude"];
            let telephone = req.body["telephone"];
            let address = req.body["address"]; 

            let password = req.body["password"];
            if(type == "place"){
                if(updatename) formData["$set"]["name"] = updatename;
                if(latitude) formData["$set"]["latitude"] = latitude;
                if(longitude) formData["$set"]["longitude"] = longitude;
                if(telephone) formData["$set"]["telephone"] = telephone;
                if(address) formData["$set"]["address"] = address;
            }
            else if(type == "user"){
                if(updatename) formData["$set"]["name"] = updatename;
                if(password) {
                    let salt = bcrypt.genSaltSync(saltRounds);
                    password = bcrypt.hashSync(password, salt);
                    formData["$set"]["password"] = password;
                }
				if(administrator === "true") formData["$set"]["administrator"] = true;
				else formData["$set"]["administrator"] = false;
            }

            if(type == "place"){
                Place.findOneAndUpdate({"name": name}, formData, {new: true}, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.send(r);
                    return; 
                });
            }
            else if(type == "user"){
                User.findOneAndUpdate({"name": name}, formData, {new: true}, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.send(r);
                    return; 
                });
            }
        } 
        else{
            res.json({"failed": "You are not the administrator."});
        }
    });
});

app.delete("/delete", (req, res)=>{
    let login = jwt.decode(req.cookies.Login, "Login");
    let name = req.body["name"];
    let type = req.body["type"];

    User.findOne({"name": login.name}, (err, data)=>{
        // show an error page in front end
        if(err){
            res.json({"failed": "DB error."});
            return;
        }

        if(data == null){
            res.json({"failed": "Data not found"});
            return;
        }
        if(data.administrator == false){
            //  
            res.json({"failed": "Yor are not the administrator."});
            return;
        }
        else{
            if(type == "place"){
                // use name as the key 
                Place.remove({"name": name}, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.send(r);
                    return; 
                });
            }
            else if(type == "user"){
                // use name as the key
                User.remove({"name": name}, (err,r)=>{
                    if(err) {res.json({"failed": "DB error."}); return;}  
                    res.send(r);
                    return; 
                });
            }
        }
    });
});

/* handle all request */
app.all('*', (req,res)=>{
    res.sendFile(__dirname+"/index.html")
})
