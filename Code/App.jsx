const {useRouteMatch, useParams, useLocation} = ReactRouterDOM;
const {BrowserRouter, Link, Route, Switch} = ReactRouterDOM;
const Router = BrowserRouter;

// to-do: replace with your server's hostname
const path = "http://csci2720-g104.cse.cuhk.edu.hk";

/* utility functions for form validation */
function displayErr(el,msg){alert('FieldError: ' + msg); el.focus(); return false}

function ValidateForm(form){
	let formBody = {};
	// Looping over every form control incl <input>, <textarea>, and <select>
	for(var i = 0, p, el, els = form.elements; el = els[i]; i++){
		// validate empty field, radio and checkboxes
		if(el.hasAttribute('required')){
			if(el.type == 'radio'){
				if(lastEl && lastEl == el.name) continue;
					for (var j = 0, chk = false, lastEl = el.name, choices = form[lastEl],
						choice; choice = choices[j]; j++)
						if (choice.checked) {chk = true; break;}
					if(!chk) return displayErr(el, 'choose a ' + el.name);
					continue;
			} else if((el.type == 'checkbox' && !el.checked) || el.value == '')
					return displayErr(el, el.name + ' is required');
		}
		if((p = el.getAttribute('pattern')) && !new RegExp(p).test(el.value))
			return displayErr(el, 'invalid ' + el.name);
		if (el.name)
			formBody[el.name] = el.value;
	}
	return formBody;
};

/* container classes */
class App extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			login: 0, // 0: not authenticated, 1: user, 2: admin
			username: "Guest"
		};
		this.auth();
	}
	
	// authenticate users
	auth(){
		fetch(path+"/auth")
		.then((response) => response.json())
		.then((data) => {
			if (!data["failed"]){
				this.setState({ username: data["name"] });
				if (data["administrator"] == true){
					this.setState({ login: 2 });
				} else {
					this.setState({ login: 1 });
				} 
			} else {
				this.setState({ login: 0 });
			}
		})
		.catch(() => {
			this.setState({ login: 0 });
		});
	}
	
	render(){
		return(
			<>
				<Header name={this.props.name} />
				<h2 style={{position: 'absolute', top: '3%', right: '3%'}}>{this.state.username}</h2>
				<Router>
					{this.state.login == 0 && <Login setState={state => this.setState(state)} />}
					{this.state.login == 1 && <User setState={state => this.setState(state)} />}
					{this.state.login == 2 && <Admin setState={state => this.setState(state)} />}
				</Router>
			</>
		);
	}
}

class Login extends React.Component{
	constructor(props){
		super(props);
		this.Login = this.Login.bind(this);
	}
	
	// login users
	Login(e){
		e.preventDefault();
		var form = document.querySelector("#target-form");
		var formBody = ValidateForm(form);
		if (form && formBody){
			form.reset();
			fetch(path+"/login",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formBody),
				}
			).then((response) => response.json())
			.then((data) => {
				if (data["success"]){
					alert("You logged in successfully!");
					if (data["administrator"]){
						this.props.setState({
							  login: 2,
							  username: data["name"]
						});
					} else {
						this.props.setState({
							  login: 1,
							  username: data["name"]
						});
					}
				} else alert('Wrong user name or password.');
			})
			.catch(() => {
				alert('Wrong user name or password.');
			});
		}
	}
	
	render(){
		return(
			<div id="background">
				<div className="d-flex justify-content-center" id="formoutside">
					<div className="center p-4" id="loginform" style={{ marginTop: screen.height / 5.5 }}>
						<h3 className="text-light mb-3 text-start">Sign In</h3>
						<form id="target-form" onSubmit={this.Login}>
							<div className="form-group mb-2">
								<input type="text" className="mb-2" name="username" placeholder= "Username" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<input type="password" className="mb-2" name="password" placeholder="Password" required pattern="\w+" />
							</div>
							<input type="submit" className="btn btn-primary" id="loginbtn" readOnly value="Login" />
						</form>
					</div>
				</div>
			</div>
		);	
	}
}

class User extends React.Component{
	constructor(props){
		super(props);
		this.state = {path: window.location.pathname}
		this.Logout = this.Logout.bind(this);
	}
	
	// logout users
	Logout(e){
		fetch(path+"/logout",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}
		).then((response) => response.json())
		.then((data) => {
			if (data["success"]){
				alert("You logged out successfully!");
				this.props.setState({
					login: 0, 
					username: "Guest"
				});
			} else alert('Unexpected error occurred, please try again later.');
		})
		.catch(() => {
			alert('Unexpected error occurred, please try again later.');
		});
	}
	
	render(){
		return(
			<div>
				<nav className="navbar navbar-expand-lg navbar-light bg-light justify-content-center">
					<ul className="navbar-nav mr-auto">
						<Link to="/" className="nav-link" onClick={() => this.setState({ path: "/" })}>Home</Link>
						<Link to="/place-search" className="nav-link" onClick={() => this.setState({ path: "/place-search" })}>Places</Link>
						<Link to="/place-fav" className="nav-link" onClick={() => this.setState({ path: "/place-fav" })}>Favourite</Link>
						<Link to="/chart" className="nav-link" onClick={() => this.setState({ path: "/chart" })}>Chart</Link>
						<Link to="/" className="nav-link" onClick={this.Logout}>Logout</Link>
					</ul>
				</nav>
				<Switch>
					<Route exact path="/" component={ShowMap} setState={state => this.setState(state)} />
					<Route path="/place/:id" render={(props) => <Place {...props} setState={state => this.setState(state)} />} />
					<Route path="/place-search">
						<DisplayTable type="places" fav={false} setState={state => this.setState(state)} />
					</Route>
					<Route path="/place-fav">
						<DisplayTable type="places" fav={true} setState={state => this.setState(state)} />
					</Route>
					<Route exact path="/chart" component={ShowChart} setState={state => this.setState(state)} />
					<Route path="*" component={NoMatch} />
				</Switch>
			</div>
		);
	}
}

class Admin extends React.Component{
	constructor(props){
		super(props);
		this.state = {path: window.location.pathname}
		this.Logout = this.Logout.bind(this);
		this.Refresh = this.Refresh.bind(this);
	}
	
	// logout users
	Logout(e){
		fetch(path+"/logout",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}
		).then((response) => response.json())
		.then((data) => {
			if (data["success"]){
				alert("You logged out successfully!");
				this.props.setState({
					login: 0,
					username: "Guest"
				});
			} else alert('Unexpected error occurred, please try again later.');
		})
		.catch(() => {
			alert('Unexpected error occurred, please try again later.');
		});
	}
	
	// refresh place data
	Refresh(e){
		fetch(path+"/reload")
		.then((response) => response.json())
		.then((data) => {
			if (data["success"]){
				alert("Place data are refreshed!");
			} else alert('Unexpected error occurred, please try again later.');
		})
		.catch(() => {
			alert('Unexpected error occurred, please try again later.');
		});
	}
	
	render(){
		return(
			<div>
				<nav className="navbar navbar-expand-lg navbar-light bg-light justify-content-center">
					<ul className="navbar-nav mr-auto">							
						<Link to="/" className="nav-link" onClick={() => this.setState({ path: "/" })}>Home</Link>
						<Link to="/place-admin" className="nav-link" onClick={() => this.setState({ path: "/place-admin" })}>Manage Places</Link>
						<Link to="/user-admin" className="nav-link" onClick={() => this.setState({ path: "/user-admin" })}>Manage Users</Link>
						<Link to="/" className="nav-link" onClick={this.Refresh}>Refresh</Link>
						<Link to="/" className="nav-link" onClick={this.Logout}>Logout</Link>
					</ul>
				</nav>
				<Switch>
					<Route exact path="/" component={ShowMap} setState={state => this.setState(state)} />
					<Route path="/place/:id" render={(props) => <Place {...props} setState={state => this.setState(state)} />} />
					<Route exact path="/place-admin">
						<ManagePlace setState={state => this.setState(state)} />
					</Route>
					<Route exact path="/user-admin">
						<ManageUser setState={state => this.setState(state)} />
					</Route>
					<Route path="*" component={NoMatch} />
				</Switch>
			</div>
		);
	}
}

/* component classes */
class Header extends React.Component{
	render(){
		return(
			<header className="bg-warning p-1">
				<h1 className="display-4">{this.props.name}</h1>
			</header>
		);
	}
}

class Place extends React.Component{
	constructor(props){
		super(props);
		if (!props.match)
			return;
		const { id } = props.match.params;
		this.state = {
			placeID: id, 
			waitTime: "Not Available", 
			isFav: false
		};
		// initialize place detail
		if (this.state.placeID){
			// find place from database
			fetch(path+"/places")
			.then((response) => response.json())
			.then((data) => {
				for(var i = 0; i < data.length; i++){
					if(this.state.placeID == data[i]._id){
						this.setState({ data: data[i] })
						return;
					}
				}
				this.setState({ data: null });
			})
			.then(() => {
				if(this.state.data){
					// load user comments
					this.loadComment();
					// load waiting time
					fetch(path+"/refresh")
					.then((response) => response.json())
					.then((data) => {
						for(var i=0; i < data["waitTime"].length; i++){
							if (this.state.data.name == data["waitTime"][i]["hospName"])
								this.setState({ waitTime: data["waitTime"][i]["topWait"] });
						}
					})
					.finally(() => {
						// generate map
						mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kZXMyNTgiLCJhIjoiY2tubHkzeWl1MGppcTJucXZxOXJnYW00aiJ9.IyjsaI6Sp3k1FNZ8XtoypA';
						var map = new mapboxgl.Map({
							container: 'map' + this.state.data._id,
							zoom: 9.5,
							style: 'mapbox://styles/mapbox/streets-v11',
							center: [114.109497, 22.361428]
						});
						var marker = new mapboxgl.Marker()
						.setLngLat({lng: this.state.data.longitude, lat: this.state.data.latitude})
						.addTo(map);
					});
					fetch(path+"/checkfav?id="+this.state.data._id)
					.then((response) => response.json())
					.then((result) => {
						if (!result["failed"])
							this.setState({ isFav: result["fav"] });
					})
				}
			});
		}
		this.SubmitComment = this.SubmitComment.bind(this);
		this.AddFavourite = this.AddFavourite.bind(this);
		this.RemoveFavourite = this.RemoveFavourite.bind(this);
	}
	
	// user submit comment
	SubmitComment(e){
		e.preventDefault();
		var form = document.querySelector("#target-form");
		var formBody = ValidateForm(form);
		if (form && formBody){
			form.reset();
			fetch(path+"/comment",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formBody),
				}
			).then((response) => response.json())
			.then((data) => {
				if (data["failed"]){
					alert("Error: " + data["failed"]);
				} else {
					fetch(path+"/places")
					.then((response) => response.json())
					.then((data) => {
						for(var i = 0; i < data.length; i++){
							if(this.state.placeID == data[i]._id){
								this.setState({ data: data[i] })
								break;
							}
						}
						this.loadComment();
					})
				}
			})
			.catch(() => {
				alert('Unexpected error occurred, please try again later');
			})
		}
	}
	
	// load users comment
	loadComment(){
		if (document.querySelector("#comments")){
			document.querySelector("#comments").innerHTML = "";
			if(this.state.data.comments){
				let color = "red";
				for (var i = 0, j = 0; i < this.state.data.comments.length; i++){
					fetch(path+"/comment?id=" + this.state.data.comments[i])
					.then((response) => response.json())
					.then((comment) => {
						let newComment = document.createElement("div");
						let element = '<div><svg height="100" width="100"><circle cx="50" cy="50" r="40"></svg></div><div><h5></h5><p></p></div>';
						newComment.innerHTML = element;
						newComment.id = 'comment-' + (j+1);
						newComment.className = "d-flex";
						newComment.querySelectorAll("div")[0].className = "flex-shrink-0";
						newComment.querySelectorAll("div")[1].className = "flex-grow-1";
						newComment.querySelector("h5").innerHTML = comment.username;
						newComment.querySelector("p").innerHTML = comment.message;
						switch(j%4){
							case 0:
								color = "red";
								break;
							case 1:
								color = "yellow";
								break;
							case 2:
								color = "blue";
								break;
							case 3:
								color = "green";
								break;
						}
						newComment.querySelector("circle").setAttribute("fill", color);
						document.querySelector("#comments").appendChild(newComment);
						j++;
					});
				}
			}
		}
	}
	
	// add place to favourite
	AddFavourite(e){
		e.preventDefault();
		var form = document.querySelector("#addfav");
		var formBody = ValidateForm(form);
		fetch(path+"/favPlace",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formBody),
			}
		).then((response) => response.json())
		.then((data) => {
			if (data["failed"]){
				alert("Error: " + data["failed"]);
			} else {
					this.setState({ isFav: true });
			}
		})
		.catch(() => {
				alert('Unexpected error occurred, please try again later');
		});
	}
	
	// remove place from favourite
	RemoveFavourite(e){
		e.preventDefault();
		var form = document.querySelector("#delfav");
		var formBody = ValidateForm(form);
		fetch(path+"/favPlace",
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formBody),
			}
		).then((response) => response.json())
		.then((data) => {
			if (data["failed"]){
				alert("Error: " + data["failed"]);
			} else {
					this.setState({ isFav: false });
			}
		})
		.catch(() => {
			alert('Unexpected error occurred, please try again later');
		});
	}
	
	render(){
		if(this.state && this.state.data){
			return(
				<div className="mx-5 my-3">
					<div className="m-3">
						<h2>Name: {this.state.data.name}</h2>
						<p>Telephone: {this.state.data.telephone}</p>
						<p>Address: {this.state.data.address}</p>
						<p>Waiting Time: {this.state.waitTime}</p>
						<h2>Location</h2>
						<div id={'map'+this.state.data._id} style={{width: '600px', height: '450px'}}></div>
					</div>
					<div className="container m-3">
						<h2>Comments</h2>
						<div id="comments"></div>
						<hr />
						<h6>Add your comment:</h6>
						<form id="target-form" onSubmit={this.SubmitComment}>
							<input type="hidden" name="placename" value={this.state.data.name} />
							<div className="mb-3">
								<label htmlFor="message" className="form-label">Comment</label>
								<textarea className="form-control" name="message" rows="3" required pattern="^[\w\- ]+$"></textarea>
							</div>
							<input type="submit" value="Add Comment" />
						</form>
						{(this.state.isFav)?
						(<form id="delfav" onSubmit={this.RemoveFavourite}>
							<input type="hidden" name="placename" value={this.state.data.name} />
							<input type="submit" value="Delete from Favourite" className="my-2" />
						</form>):
						(<form id="addfav" onSubmit={this.AddFavourite}>
							<input type="hidden" name="placename" value={this.state.data.name} />
							<input type="submit" value="Add to Favourite" className="my-2" />
						</form>)}
					</div>
				</div>
			)
		} else return null;
	}
}

class ShowMap extends React.Component{
	constructor(){
		super();
		this.state = {
			visible: null,
			place_name: "",
			address: "",
			id:""
		};
	}
	
	// make the textblock visible
	appear(e){
		this.setState({ visible: 1 })
	}
	
	// make the textblock disappear
	disappear(){
		this.setState({ visible: null })
	}
	
	// stop event propafation
	remain(e){
		e.stopPropagation();
	}

	render(){
		let locations = [];
		fetch(path+"/places")
			.then((response) => response.json())
			.then((data) => {
				// initialize map
				mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kZXMyNTgiLCJhIjoiY2tubHkzeWl1MGppcTJucXZxOXJnYW00aiJ9.IyjsaI6Sp3k1FNZ8XtoypA';
				var map = new mapboxgl.Map({
					container: 'map',
					zoom: 9.5,
					style: 'mapbox://styles/mapbox/streets-v11',
					center: [114.109497, 22.361428]
				});
				// add markers to map
				var index = 0;
				data.forEach((place) => {
					let marker = new mapboxgl.Marker()
						.setLngLat({ lng: place.longitude, lat: place.latitude })
						.addTo(map);
					marker.getElement().addEventListener('click', (event) => {
						this.appear(event)
						this.setState({
							place_name: place.name,
							address: place.address,
							id: place._id
						})
					});
					index++;
				});
			})
			.catch(() => {});

		return(
			<>
				{this.state.visible &&
				<div onClick={(e) => this.disappear()} className="d-flex" style={{
					color: "white",
					position: "fixed",
					backgroundColor:  'rgba(0,0,0,0.5)',
					width: "100%",
					height: "100%",
					top: 0,
					left: 0,
					zIndex:100
				}}>
					<div onClick={(event) => this.remain(event)} style={{ margin: "auto", backgroundColor: "white", color: "black"}}>
						<span style={{fontWeight: "bold"}}>Name: </span>{<Link to={"/place/" + this.state.id} >{this.state.place_name}</Link>}<br></br>
						<span style={{fontWeight: "bold"}}>Address : </span>{this.state.address}<br></br>
					</div>
				</div>}
				<div className="mx-5 my-3">
					<h2>Map</h2>
					<div id='map' className="my-3" style={{ width: '600px', height: '450px' }}></div>
				</div>
			</>
		);
	}
}

class ShowChart extends React.Component{
	_isMounted = true;
    displaychart(){
		// draw chart
        const fetchCompleted = (finishedHour, hospDict, hospName, label, type, titlename) => {
			if(!finishedHour || !hospDict || !hospName || !label || !type || !titlename)
				return null;
            if(finishedHour == type){
                const hospSelector = document.getElementById("hospSelector");
                if(type == 10){
                    hospName.forEach((value, index) => {
                        let opt = document.createElement('option');
                        opt.value = value;
                        opt.innerHTML = value;
                        hospSelector.appendChild(opt);
                    })
                    hospSelector.selectedIndex = 0;
                }
                const ctx = type == 10 ? document.querySelector("#myChart").getContext('2d') 
									   : document.querySelector("#myChart2").getContext('2d');
                const myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: label,
                        datasets: [{
                            label: 'Minimum Waiting Time' + titlename,
                            data:  hospDict[hospSelector.value],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 3
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                labels: {
                                    font: {
                                        size: 20
                                    }
                                },
                                
                            }
                        },
                        scales: {
                            y: {
                                max: 10,
                                min: 0,
                                ticks: {
                                    stepSize: 1,
                                    font: {
                                        size: 16
                                    }
                                },
     
                            },
                            x:{
                                ticks: {
                                    font: {
                                        size: 16
                                    }
                                },

                            }
                            
                        }
                    }
                });
                return myChart;
            }
            return null;
        }
		// fetch 10 hours history data
		let today = new Date();
        let hospName= []; let finishedHour = 0; let total_hour = [];
		let hour10Dict = {}; let hosp10Dict = {};
        let chart7; let chart10;
        today.setHours(today.getHours() - 10);
        for(let i = 1; i < 11; i++){
            today.setHours(today.getHours() + 1);
            let datetime = String(today.getFullYear()) + String(today.getMonth()+1).padStart(2, '0') + String(today.getDate()).padStart(2, '0') + '-' +  String(today.getHours()).padStart(2, '0') + "00";
            total_hour.push(String(today.getHours()).padStart(2, '0') + ":00")
            fetch("https://api.data.gov.hk/v1/historical-archive/get-file?url=http%3A%2F%2Fwww.ha.org.hk%2Fopendata%2Faed%2Faedwtdata-en.json&time="+datetime).then((timedata) => timedata.json())
            .then((timedata)=>{if(this._isMounted) this.setState({tempdata : timedata.waitTime});})
            .then(()=>{    
                hour10Dict[i] = [];
                for(let data of this.state.tempdata){
                    if(hospName.length < 18){
                        hospName.push(data.hospName)
                    }
                    if (data.topWait.indexOf("Over ") == 0){
                        hour10Dict[i].push( parseInt(data.topWait.substring(5, 6)));
                    } else {
                        hour10Dict[i].push(1);
                    }
            }})
            .then(() => {
                finishedHour += 1;
                if(finishedHour == 10){
                    for (const [key, value] of Object.entries(hour10Dict)) {
                        for(let k = 0; k < value.length; k++){
                            if(!(hospName[k] in hosp10Dict)){
                                hosp10Dict[hospName[k]] = [];
                            }
                            hosp10Dict[hospName[k]].push(value[k]);
                        }
                    }
                    chart10 = fetchCompleted(finishedHour, hosp10Dict, hospName, total_hour, 10, " In The Past 10 Hours");
                }
            })
			.catch(() => {});
        }
		// fetch 7 days history data
        today = new Date();
        today.setDate(today.getDate() - 7);
        let total_date = []; let finishedDay = 0;
        let hour7Dict = {}; let hosp7Dict = {};
        for(let i = 1; i < 8; i++){
            today.setDate(today.getDate() + 1);
            let datetime = String(today.getFullYear()) + String(today.getMonth()+1).padStart(2, '0') + String(today.getDate()).padStart(2, '0') + '-' +  String(today.getHours()).padStart(2, '0') + "00";
            total_date.push(String(String(today.getDate()).padStart(2, '0') + "/" + (today.getMonth()+1)).padStart(2, '0'))
            fetch("https://api.data.gov.hk/v1/historical-archive/get-file?url=http%3A%2F%2Fwww.ha.org.hk%2Fopendata%2Faed%2Faedwtdata-en.json&time="+datetime).then((timedata) => timedata.json())
			.then((timedata)=> {if(this._isMounted) this.setState({tempdata : timedata.waitTime});})
            .then(()=>{    
                hour7Dict[i] = [];
                for(let data of this.state.tempdata){
                    if (data.topWait.indexOf("Over ") == 0){
                        hour7Dict[i].push( parseInt(data.topWait.substring(5, 6)));
                    } else{
                        hour7Dict[i].push(1);
                    }
            }})
            .then(() => {
                finishedDay += 1;
                if(finishedDay == 7){
                    hosp7Dict = {};
                    for (const [key, value] of Object.entries(hour7Dict)) {
                        for(let k = 0; k < value.length; k++){
                            if(!(hospName[k] in hosp7Dict)){
                                hosp7Dict[hospName[k]] = [];
                            }
                            hosp7Dict[hospName[k]].push(value[k]);
                        }
                    }
                    chart7 = fetchCompleted(finishedDay, hosp7Dict, hospName, total_date, 7, " In This Hour Of Past 7 Days");
                }
            })
			.catch(() => {});
        }
		// change chart according to user selection
        const hospSelector = document.getElementById("hospSelector");
        const selectedHospital = (new7Data, new10Data) => {
            chart7.data.datasets[0].data = new7Data;
            chart10.data.datasets[0].data = new10Data;
            chart7.update();
            chart10.update();
        }
		hospSelector.addEventListener("change", function() {{
            selectedHospital(hosp7Dict[hospSelector.value], hosp10Dict[hospSelector.value]);
        }});
    }
	
    componentDidMount(){this.displaychart();}
	componentWillUnmount(){this._isMounted = false;}
	
    render(){
        return (
            <div className="mx-5 my-3">
                <h2>Chart</h2>
                <select id="hospSelector"/>
                <canvas id="myChart" />
                <canvas id="myChart2" />
            </div>
        );
    }
}

class DisplayTable extends React.Component{
	constructor(props){
        super(props);
		this.state = {
			loading: true, 
			sortfield: "name", 
			sortorder: -1, 
			path: window.location.pathname
		};
    }

	// sort data
	sort(field, order){
		// compare criterion
		// order -1 mean ascending, 1 means descending
		function compare(a,b){
			let a1 = null;
			let b1 = null;
			if(field == "name") {a1 = a.name; b1 = b.name}; 
			if(field == "latitude") {a1 = a.latitude; b1 = b.latitude}; 
			if(field == "longitude") {a1 = a.longitude; b1 = b.longitude}; 
			if(field == "address") {a1 = a.address; b1 = b.address}; 
			if(field == "telephone") {a1 = a.telephone; b1 = b.telephone}; 
			if(a1 < b1){
				return order;
			}
			else if((a1 > b1)){
				return -order;
			}
			return 0;
		}
		// targets is a nodelist, turn it to array first for sorting
		let targets = this.state.displayData;
		targets = Array.from(targets);
		targets.sort(compare);
		this.setState({ displayData: targets });
	}
	
	// search data
	search(showall){
		if(showall){
			if(document.querySelector("#keywords"))
				document.querySelector("#keywords").value = "";
			this.setState({ displayData: this.state.rawData });
			return;
		}
		let keywords = document.querySelector("#keywords").value;
		let field = document.querySelector("#field").value;
		if(keywords == "" || keywords == null) {alert("Please enter the keywords to be searched."); return;}
		keywords = keywords.toLowerCase();
		let targets = this.state.rawData;
		let search_result = [];
        for(let i of targets){
            // case insensitive search
            if(String(i[field]).toLowerCase().search(keywords) != -1){
                search_result.push(i);
            }
        } 
		this.setState({ displayData: search_result });
	}
	
	// load data
	loadData(){
		if(this.props.type == "users"){
			fetch(path+"/users").then((data)=>data.json())
			.then((data)=>this.setState({ rawData: data, displayData: data, loading: false }))
		} else {
			if (this.props.fav){
				fetch(path+"/favPlace").then((data)=>data.json())
				.then((data)=>this.setState({ rawData: data, displayData: data, loading: false }))
			} else {
				fetch(path+"/places").then((data)=>data.json())
				.then((data)=>this.setState({ rawData: data, displayData: data, loading: false }))
			}
		}
	}
	
	// load data when necessary
	componentDidMount(){this.loadData();}
	componentDidUpdate(){
		if(window.location.pathname != this.state.path){
			if (document.querySelector("#keywords"))
				document.querySelector("#keywords").value = "";
			this.setState({ path: window.location.pathname });
			this.loadData();
		}
	}

	render(){
		// styles for the sorting buttons
		let activateup = "bi bi-arrow-up bg-info";
		let inactivateup =  "bi bi-arrow-up bg-secondary";
		let activatedown = "bi bi-arrow-down bg-info";
		let inactivatedown =  "bi bi-arrow-down bg-secondary";
		if (this.props.type == "users"){
			return(
				<div className="mx-5 my-3">
					<div className="d-flex flex-row-reverse my-2">
						<button className="btn btn-primary mx-2" onClick={()=>this.search(true)} >Showall</button>
						<button className="btn btn-primary mx-2" onClick={()=>this.search(false)} >Search</button>
						<div>
							<label>&nbsp;Search Keywords:&nbsp;</label>
							<input type="text" id="keywords" name="keywords"/>
						</div>
						<div>
							<label>Search field:&nbsp;</label>
							<select id="field" name="field">
								<option readOnly value="name">Name</option>
								<option readOnly value="password">Password Digest</option>
							</select>
						</div>
					</div>
					<table id="search" className="table table-striped table-hover">
						<thead>
						<tr>
							<th>Name</th>
							<th>Password Digest</th>
						</tr>
						</thead>
						<tbody>
							{(this.state.displayData)?
								this.state.displayData.map((file, index)=>(
									<tr>
										<td className="name" id={"name"}>
											{file.name}
										</td>
										<td className="password" id={"password"+String(index)}>
											{file.password}
										</td>
									</tr>
								)):null
							}
						</tbody>
					</table>
				</div>
			);
		} else {
			return(
				<div className="mx-5 my-3">
					<div className="d-flex flex-row-reverse my-2">
						<button className="btn btn-primary mx-2" onClick={()=>this.search(true)} >Showall</button>
						<button className="btn btn-primary mx-2" onClick={()=>this.search(false)} >Search</button>
						<div>
							<label>&nbsp;Search Keywords:&nbsp;</label>
							<input type="text" id="keywords" name="keywords"/>
						</div>
						<div>
							<label>Search field:&nbsp;</label>
							<select id="field" name="field">
								<option readOnly value="name">Name</option>
								<option readOnly value="latitude">Latitude</option>
								<option readOnly value="longitude">Longitude</option>
								<option readOnly value="address">address</option>
								<option readOnly value="telephone">telephone</option>
							</select>
						</div>	
					</div>

					<table id="search" className="table table-striped table-hover">
						<thead>
							<tr>
								<th>Name&nbsp;
									<i className={(this.state.sortfield == "name" && this.state.sortorder == 1)? activatedown:inactivatedown}
									onClick={()=> {this.sort("name", 1); this.setState({ sortfield: "name", sortorder: 1 });}}></i>
									<i className={(this.state.sortfield == "name" && this.state.sortorder == -1)? activateup:inactivateup} 
									onClick={()=> {this.sort("name", -1); this.setState({ sortfield: "name", sortorder: -1 });}}></i>
								</th>
								<th>Latitude&nbsp;
									<i className={(this.state.sortfield == "latitude" && this.state.sortorder == 1)? activatedown:inactivatedown}
									onClick={()=> {this.sort("latitude", 1); this.setState({ sortfield: "latitude", sortorder: 1 });}}></i>
									<i className={(this.state.sortfield == "latitude" && this.state.sortorder == -1)? activateup:inactivateup} 
									onClick={()=> {this.sort("latitude", -1); this.setState({ sortfield: "latitude", sortorder: -1 });}}></i>
								</th>
								<th>Longitude&nbsp;
									<i className={(this.state.sortfield == "longitude" && this.state.sortorder == 1)? activatedown:inactivatedown} 
									onClick={()=> {this.sort("longitude", 1); this.setState({ sortfield: "longitude", sortorder: 1 });}}></i>
									<i className={(this.state.sortfield == "longitude" && this.state.sortorder == -1)? activateup:inactivateup}  
									onClick={()=> {this.sort("longitude", -1); this.setState({ sortfield: "longitude", sortorder: -1 });}}></i>
								</th>
								<th>address&nbsp;
									<i className={(this.state.sortfield == "address" && this.state.sortorder == 1)? activatedown:inactivatedown}
									onClick={()=> {this.sort("address", 1); this.setState({ sortfield: "address", sortorder: 1 });}}></i>
									<i className={(this.state.sortfield == "address" && this.state.sortorder == -1)? activateup:inactivateup}
									onClick={()=> {this.sort("address", -1); this.setState({ sortfield: "address", sortorder: -1 });}}></i>
								</th>
								<th>telephone&nbsp;
									<i className={(this.state.sortfield == "telephone" && this.state.sortorder == 1)? activatedown:inactivatedown}
									onClick={()=> {this.sort("telephone", 1); this.setState({ sortfield: "telephone", sortorder: 1 });}}></i>
									<i className={(this.state.sortfield == "telephone" && this.state.sortorder == -1)? activateup:inactivateup}
									onClick={()=> {this.sort("telephone", -1); this.setState({ sortfield: "telephone", sortorder: -1 });}}></i>
								</th>
							</tr>
						</thead>
						<tbody>
							{(this.state.displayData)?
								this.state.displayData.map((file, index)=>(
									<tr key={file._id}>
										<td className="name" id={"name"}>
											<Link to={"/place/" + file._id} onClick={() => this.props.setState({ path: "/place/" + file._id })}>{file.name}</Link>
										</td>
										<td className="latitude" id={"latitude"+String(index)}>
											{file.latitude}
										</td>
										<td className="longitude" id={"longitude"+String(index)}>
											{file.longitude}
										</td>
										<td className="address col-md-3" id={"address"+String(index)}>
											{file.address}
										</td>
										<td className="telephone" id={"telephone"+String(index)}>
											{file.telephone}
										</td>
									</tr>
								)):null
							}
						</tbody>
					</table>
				</div>
			);
		}
	}
}

class ManagePlace extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			action: 0, // 0: view, 1: add, 2: edit, 3: delete
			loading: true,
		};
		this.SubmitForm = this.SubmitForm.bind(this);
	}
	
	componentDidMount(){
		fetch(path+"/places").then((data)=>data.json())
		.then((data)=>this.setState({ displayData: data, loading: false }))
	}
	 
	 // change target form
	ChangeForm(){
		var form = document.querySelector("#target-form")
		if (form) form.reset();
		this.setState({ action: (this.state.action + 1) % 4 });
	}
	
	// submit target form
	SubmitForm(e){
		e.preventDefault();
		var submitMethod, submitLink;
		var form = document.querySelector("#target-form");
		var formBody = ValidateForm(form);
		if (form && formBody){
			form.reset();
			switch (this.state.action){
				case 1:
					submitMethod = "POST";
					submitLink = path+"/create";
					break;
				case 2:
					submitMethod = "PUT";
					submitLink = path+"/update";
					break;
				case 3:
					submitMethod = "DELETE";
					submitLink = path+"/delete";
					break;
				default:
					return;
			}
			fetch(submitLink,
				{
					method: submitMethod,
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formBody),
				}
			).then((response) => response.json())
			.then((data) => {
				if (data["failed"]){
					alert("Error: " + data["failed"]);
				}
			})
			.catch(() => {
				alert('Unexpected error occurred, please try again later');
			})
			.finally(() => {
				this.setState({ action: 0 });
				this.props.setState({ path: "/place-admin" });
			});
		}
	} 
	
	render(){
		switch(this.state.action){
			case 0:
				return(
					<>
						<DisplayTable type="places" fav={false} setState={state => this.setState(state)} />
						<button className="btn btn-primary mx-5" onClick={() => this.ChangeForm()}>View Form</button>
					</>
				);
			case 1:
				return(
					<div className="mx-5 my-3">
						<h2>Add Place</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Latitude:&nbsp;</label>
								<input type="text" name="latitude" required pattern="^[\d\.]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Longitude:&nbsp;</label>
								<input type="text" name="longitude" required pattern="^[\d\.]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Address:&nbsp;</label>
								<input type="text" name="address" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-,.]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Telephone:&nbsp;</label>
								<input type="text" name="telephone" required pattern="^[\d]+$" />
							</div>
							<input type="hidden" name="type" readOnly value="place" />
							<input type="submit" className="btn btn-primary" readOnly value="Add" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
						</form>
					</div>
				);
			case 2:
				return(
					<div className="mx-5 my-3">
						<h2>Update Place</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Old Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>New Name:&nbsp;</label>
								<input type="text" name="updatename" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Latitude:&nbsp;</label>
								<input type="text" name="latitude" required pattern="^[\d\.]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Longitude:&nbsp;</label>
								<input type="text" name="longitude" required pattern="^[\d\.]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Address:&nbsp;</label>
								<input type="text" name="address" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-,.]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Telephone:&nbsp;</label>
								<input type="text" name="telephone" required pattern="^[\d]+$" />
							</div>
							<input type="hidden" name="type" readOnly value="place" />
							<input type="submit" className="btn btn-primary" readOnly value="Update" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
						</form>
					</div>
				);
			case 3:
				return(
					<div className="mx-5 my-3">
						<h2>Delete Place</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<input type="hidden" name="type" readOnly value="place" />
							<input type="submit" className="btn btn-primary" readOnly value="Delete" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>View List</button>
						</form>
					</div>
				);
			default:
				return(
					<div className="mx-5 my-3">
						<h2>Error Occurred</h2>
						<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
					</div>
				)
		}
	}
}

class ManageUser extends React.Component{
	constructor(props) {
		super(props);
		this.state = {
			action: 0, // 0: view, 1: add, 2: edit, 3: delete
			loading: true,
		};
		this.SubmitForm = this.SubmitForm.bind(this);
	}
	
	componentDidMount(){
		fetch(path+"/users").then((data)=>data.json())
		.then((data)=>this.setState({ displayData: data, loading: false }))
	}
	
	// change target form
	ChangeForm(){
		var form = document.querySelector("#target-form")
		if (form) form.reset();
		this.setState({ action: (this.state.action + 1) % 4 });
	}
	
	// submit target form
	SubmitForm(e){
		e.preventDefault();
		var submitMethod, submitLink;
		var form = document.querySelector("#target-form");
		var formBody = ValidateForm(form);
		if (form && formBody){
			form.reset();
			switch (this.state.action){
				case 1:
					submitMethod = "POST";
					submitLink = path+"/create";
					break;
				case 2:
					submitMethod = "PUT";
					submitLink = path+"/update";
					break;
				case 3:
					submitMethod = "DELETE";
					submitLink = path+"/delete";
					break;
				default:
					return;
			}
			fetch(submitLink,
				{
					method: submitMethod,
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formBody),
				}
			).then((response) => response.json())
			.then((data) => {
				if (data["failed"]){
					alert("Error: " + data["failed"]);
				}
			})
			.catch(() => {
				alert('Unexpected error occurred, please try again later');
			})
			.finally(() => {
				this.setState({ action: 0 });
				this.props.setState({ path: "/user-admin" });
			});
		}
	}
	
	render(){
		switch(this.state.action){
			case 0:
				return(
					<>
						<DisplayTable type="users" />
						<button className="btn btn-primary mx-5" onClick={() => this.ChangeForm()}>View Form</button>
					</>
				)
			case 1:
				return(
					<div className="mx-5 my-3">
						<h2>Add User</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Password:&nbsp;</label>
								<input type="password" name="password" required pattern="^[\w@#$^&*-]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Administrator:&nbsp;</label>
								<select name="administrator">
									<option readOnly value={false}>False</option>
									<option readOnly value={true}>True</option>
								</select>
							</div>
							<input type="hidden" name="type" readOnly value="user" />
							<input type="submit" className="btn btn-primary" readOnly value="Add" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
						</form>
					</div>
				);
			case 2:
				return(
					<div className="mx-5 my-3">
						<h2>Update User</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Old Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>New Name:&nbsp;</label>
								<input type="text" name="updatename" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<div className="form-group mb-2">
								<label>Password:&nbsp;</label>
								<input type="password" name="password" required pattern="^[\w@#$^&*-]+$" />
							</div>
							<div className="form-group mb-2">
								<label>Administrator:&nbsp;</label>
								<select name="administrator">
									<option readOnly value={false}>False</option>
									<option readOnly value={true}>True</option>
								</select>
							</div>
							<input type="hidden" name="type" readOnly value="user" />
							<input type="submit" className="btn btn-primary" readOnly value="Update" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
						</form>
					</div>
				);
			case 3:
				return(
					<div className="mx-5 my-3">
						<h2>Delete User</h2>
						<form id="target-form" onSubmit={this.SubmitForm}>
							<div className="form-group mb-2">
								<label>Name:&nbsp;</label>
								<input type="text" name="name" required pattern="^[\w@#$^&*-]+( +[\w@#$^&*-]+)*$" />
							</div>
							<input type="hidden" name="type" readOnly value="user" />
							<input type="submit" className="btn btn-primary" readOnly value="Delete" />
							<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>View List</button>
						</form>
					</div>
				);
			default:
				return(
					<div className="mx-5 my-3">
						<h2>Error Occurred</h2>
						<button className="btn btn-primary mx-2" onClick={() => this.ChangeForm()}>Change Form</button>
					</div>
				);
		}
	}
}

function NoMatch(){
	let location = useLocation();
	return (
		<div className="m-3">
			<h3>
			No match for <code>{location.pathname}</code>
			</h3>
		</div>
	);
}

ReactDOM.render(<App name="Hospital Waiting Time System" />, document.querySelector("#app"));
