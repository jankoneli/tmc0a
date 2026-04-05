const express = require("express");
const app = express();
const { createServer } = require('node:http');
const { Server } = require("socket.io");
app.use("/src", express.static("public"))
app.use("/riverside", express.static("riverside"))

const fs = require("fs");
const server = createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 5e7 // 50 MB
});

const { createHash } = require('crypto');

const { v7 } = require( 'uuid');

const {marked} = require("marked")

var visitor = 0

var agendatitle = "Agenda not updated";
var agendalist = "";

var imgstud = {
    "5":"5.jpg"
}

var alttext = {

}

function updatealt(){
    var alttextlines = fs.readFileSync(__dirname+"/alttext")
    alttextlines.toString().split("\n").forEach(line => {
        alttext[line.split(",")[0]] = line.split(",")[1].replace("\r", "")
    })
}

updatealt()


console.log(alttext)

app.get("/", (req, res) => {
    visitor += 1;
    res.sendFile(__dirname+"/index.html");
})

app.get("/count", (req, res) => {
    res.send("Visitors since last restart: "+visitor.toString())
})

app.get("/students", (req, res) => {
    res.sendFile(__dirname+"/students.html");
})

app.get("/tryout/:id", (req, res) => {
    res.sendFile(__dirname+"/tryout.html")
})

app.post("/profile", (req, res) => {
    res.send("File uploaded");
});

app.get("/yearbook", (req, res) => {
    res.sendFile(__dirname+"/yearbook.html")
});

var imagelist = {
    "primary":[],
    "studsos":[]
}

masterkeyupload = "133c874210964c6b2bf71aeba5c5987db34765ca1d69be2bc6030609b1e83f65"

function updateimg(){
    imagelist = {
    "primary":[],
    "studsos":[]
}
    var primary = fs.readdirSync(__dirname+"/public/archive/sd");

primary.forEach(file => {
    imagelist["primary"].push(file)
})

var primary = fs.readdirSync(__dirname+"/public/archive/studsos");

primary.forEach(file => {
    imagelist["studsos"].push(file)
})

console.log(imagelist)
}
updateimg()


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('requestagenda', () => {
        socket.emit('agendadata', [agendatitle, agendalist]);
    })
    socket.on('requestimage', (img) => {
        socket.emit('imagelist', imagelist[img], alttext)
    })
    socket.on("requestTryout", (subject) => {
        var markedtext = marked.parse(fs.readFileSync(__dirname+"/tryout/"+subject+".md").toString())
        socket.emit("marked", markedtext)
    })
    socket.on('updateagenda', (pin, datadata, datedate) => {
        console.log(parseInt(pin))
        if(parseInt(pin) == 30109){
            agendalist = datadata;
            agendatitle = datedate;
            console.log("update success");
            socket.emit('updates')
        }
    })
    socket.on('uploadrequest', (data, file) => {
        console.log(file);
        if(createHash('sha256').update(createHash('sha256').update(data.key).digest('hex')).digest('hex') == masterkeyupload){
            console.log("upload success");
            uuidid = v7();
            fs.writeFileSync(__dirname+"/public/archive/"+data.category+"/"+uuidid+".jpg", file);
            fs.appendFileSync(__dirname+"/alttext", "\n"+uuidid+","+data.description);
            socket.emit('uploadsuccess');
            alttext = {};
            var alttextlines = fs.readFileSync(__dirname+"/alttext")
            alttextlines.toString().split("\n").forEach(line => {
                alttext[line.split(",")[0]] = line.split(",")[1].replace("\r", "")
            });
            updatealt();
            updateimg();
        }else{
            console.log("upload failed");
            console.log(createHash('sha256').update(createHash('sha256').update(data.key).digest('hex')).digest('hex'))
        }
    })
})

app.get("/riverside", (req, res) => {
    res.sendFile(__dirname+"/riverside.html")
})
app.get("/agenda", (req, res) => {
    res.sendFile(__dirname+"/agenda.html");
})

app.get("/contact", (req, res) => {
    res.sendFile(__dirname+"/contact.html");
})

app.get("/agenda/update", (req, res) => {
    res.sendFile(__dirname+"/agendaupdate.html");
})

app.get("/archive", (req, res) => {
    res.sendFile(__dirname+"/archive.html")
})

app.get("/archive/:id", (req, res) => {
    res.sendFile(__dirname + "/gallery.html")
})


app.get("/weekly", (req, res) => {
    res.sendFile(__dirname+"/weekly.html");
})

app.get("/tools", (req, res) => {
    res.sendFile(__dirname+"/tools.html");
})

app.get("/u/:id", (req, res) => {
    res.sendFile(__dirname+"/user.html")
})

app.get("/upload/archive", (req, res) => {
    res.sendFile(__dirname+"/archiveuploader.html")
})

app.get("/img/:id", (req, res) => {
    if(Object.keys(imgstud).includes(req.params.id.toString())){
        res.sendFile(__dirname+"/img/"+imgstud[parseInt(req.params.id)]);
    }else{
        res.sendFile(__dirname+"/img/placeholder.png");
    }
})

app.use(function(req,res){
    res.status(404).sendFile(__dirname+"/underconstruction.html");
});
server.listen(3030)
