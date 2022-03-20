const express = require("express");
const path = require("path");
const cors=require("cors")
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt= require('jsonwebtoken');
const { request } = require("http");
const app = express();

app.use(cors())
app.use(express.json())


const dbPath = path.join(__dirname, "college.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3005, () => {
      console.log("Server Running at http://localhost:3005/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};


initializeDBAndServer()


//Api for Total Courses

app.get("/courses", async (request, response) => {
  const getBooksQuery = `
    SELECT
      courses.course_id, courses.course_name,Professors.professor_id,Professors.professor_name
    FROM
      courses natural join Professors `;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});


//API FOR professor Details


app.get("/professor/:id", async (request, response) => {
  const {id}=request.params
  const getBooksQuery = `
    SELECT
      courses.course_id, courses.course_name,Professors.professor_id,Professors.professor_name
    FROM
      courses natural join Professors
      where Professors.professor_id=${id} `;
  const booksArray = await db.get(getBooksQuery);
  response.send(booksArray);
});


// API FOR Student Details

app.get("/student/:id", async (request, response) => {
  const {id}=request.params
  const getBooksQuery = `
    SELECT
      courses.course_id, courses.course_name,T.student_id,T.student_name
    FROM
    (student_course natural join Students ) as T natural join courses
      where T.student_id=${id} `;
  const booksArray = await db.get(getBooksQuery);
  response.send(booksArray);
});




//Api for Professorlogin


app.post("/professorlogin", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM Professors WHERE professor_name = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = password=== dbUser.password;
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      const id=dbUser.professor_id
      const x={
        jwtToken,
        id
      }
      response.send({ x });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//Api for studentlogin

app.post("/studentlogin", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM Students WHERE student_name = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser)
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = password=== dbUser.password;
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET");
      const id=dbUser.student_id
      const x={
        jwtToken,
        id
      }
      response.send({ x });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});


// API for Coursedetails

app.get("/course/:id", async (request, response) => {
  const {id}=request.params
  const getBooksQuery = `
    SELECT
      *
    FROM
    (((student_course natural join Students ) as T natural join courses) as P natural join Professors) as Q
      where Q.course_id=${id} 
      group by student_course.id`;
  const booksArray = await db.all(getBooksQuery);
  console.log(booksArray)
  response.send(booksArray);
});

//API for adding Student

app.post("/addstudent",async(request,response)=>{
  const{course_id,student_id}=request.body
  const addQuery=`insert into student_course (student_id,course_id) values(${student_id},${course_id})`
  const booksArray = await db.run(addQuery);
  response.send(booksArray);
  console.log(booksArray)
})