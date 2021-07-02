const express = require("express");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");
const OAuth2 = require("client-oauth2");

require("dotenv").config();

const auth = new OAuth2({
	clientId: process.env.UID,
	clientSecret: process.env.SECRET,
	accessTokenUri: process.env.ACCESS_TOKEN_URI,
	authorizationUri: process.env.AUTHORIZATION_URI,
	redirectUri: process.env.REDIRECT_URI
});

const app = express();
app.use(session({
	secret: "1234567890ALVARO",
	resave: true,
	saveUninitialized: false
}));
app.use(cors());
app.engine('html', require('ejs').renderFile);

app.get("/api", (req, res) => {
	if (!req.session.token)
		res.redirect('/');
	else {
		axios.get(`https://api.intra.42.fr/v2/${req.query.url}`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			res.send(response.data);
		}).catch(err => {
			res.send(err);
		});
	}
});

app.get("/campus", (req, res) => {
	if (!req.session.token) {
		return (res.redirect("/"));
	} else {
		axios.get(`https://api.intra.42.fr/v2/campus`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			return (res.render(__dirname + "/views/campus/campuses.ejs", {data: response.data}));
		}).catch(err => {
			return (res.send(err.data));
		})
	}
});

app.get("/campus/:campus", (req, res) => {
	if (!req.session.token) {
		return (res.redirect("/"));
	} else {
		axios.get(`https://api.intra.42.fr/v2/campus/${req.params.campus}`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			return (res.render(__dirname + "/views/campus/campus.ejs", {data: response.data}));
		}).catch(err => {
			return (res.send(err.data));
		})
	}
});

app.get("/events/:campus/:id", (req, res) => {
	if (!req.session.token) {
		res.redirect('/');
	} else {
		axios.get(`https://api.intra.42.fr/v2/events/${req.params.id}`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			axios.get(`https://api.intra.42.fr/v2/events/${req.params.id}/events_users`, {
				headers: {
					Authorization: `Bearer ${req.session.token}`
				}
			}).then(response_users => {
				res.render(__dirname + "/views/event/event.ejs", {event: response.data, users: response_users.data});
			}).catch(err => {
				res.send(err);
			});
		}).catch(err => {
			res.send(err);
		});
	}
});

app.get("/events/:campus", (req, res) => {
	if (!req.session.token) {
		return (res.redirect("/"));
	} else {
		axios.get(`https://api.intra.42.fr/v2/campus/${req.params.campus}/events`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			return (res.render(__dirname + "/views/event/events.ejs", {data: response.data}));
		}).catch(err => {
			return (res.send(err.data));
		})
	}
});

app.get("/users/:id", (req, res) => {
	if (!req.session.token) {
		return (res.redirect("/"));
	} else {
		axios.get(`https://api.intra.42.fr/v2/users/${req.params.id}`, {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		})
		.then(response => {
			return (res.render(__dirname + "/views/user/user.ejs", {data: response.data}));
		}).catch(err => {
			return (res.send(err.data));
		})
	}
});

app.get("/redirect", (req, res) => {
	if (!req.session.token) {
		return (res.redirect("/"));
	} else {
		axios.get("https://api.intra.42.fr/v2/me", {
			headers: {
				Authorization: `Bearer ${req.session.token}`
			}
		}).then(response => {
			return (res.redirect("/users/" + response.data.id));
		}).catch(err => {
			return (res.send(err.data));
		});
	}
});

app.get("/callback", (req, res) => {
	auth.code.getToken(req.originalUrl).then(user => {
		user.refresh().then(user => {
			req.session.refresh = user.data.refresh_token;
			req.session.token = user.accessToken;
			req.session.expires_in = user.data.expires_in;
			req.session.created_at = user.data.created_at;
			return (res.redirect("/redirect"));
		});
	}).catch(err => {
		return (res.send(err.data));
	});
});

app.get("/", (req, res) => {
	if (req.session.token)
		return (res.redirect("/redirect"));
	else
		return (res.render(__dirname + "/views/index.ejs"));
});

app.listen(8080, () => {
	console.log("Server is running on port 8080.");
});