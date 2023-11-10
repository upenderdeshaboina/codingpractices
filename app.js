const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'userData.db')
let db = null
const bcrypt = require('bcrypt')
const initializedbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/..')
    })
  } catch (error) {
    console.log(`DB Error:-${error.message}`)
    process.exit(1)
  }
}
initializedbAndServer()
const validateUser = password => {
  return password.length < 5
}
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  let checkingQuery = `
  select 
    *
  from
    user
  where
    username='${username}';
  `
  const userData = await db.get(checkingQuery)
  if (userData === undefined) {
    if (validateUser(password)) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const creatingQuery = `
      insert 
        into
      user
        (username,name,password,gender,location)
      values
        ('${username}','${name}','${hashedpassword}','${gender}','${location}');
      `
      const dbData = await db.run(creatingQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const chckingUser = `select * from user where username='${username}';`

  const data = await db.get(chckingUser)
  if (data !== undefined) {
    const ispasswordMatched = await bcrypt.compare(password, data.password)
    if (ispasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  } else {
    response.status(400)
    response.send('Invalid user')
  }
})
app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkingQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbData = await db.get(checkingQuery)
  if (dbData === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    isPassMatched = await bcrypt.compare(oldPassword, dbData.password)
    if (isPassMatched === true) {
      const istrue = validateUser(newPassword)
      if (istrue===true) {
        response.send(400)
        response.send('Password is too short')
      } else {
        const hashing = await bcrypt.hash(newPassword, 10)
        const updateQuery = `
        update
          user
        set
          password='${hashing}'
        where
          username='${username}';
        `
        const data=await db.run(updateQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
