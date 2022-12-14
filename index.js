const inquirer = require("inquirer");
const fs = require("fs");
const mysql = require("mysql2");
const cTable = require("console.table");
const { json } = require("body-parser");
const { leftPadder } = require("easy-table");
const util = require("util");

//creates a connection to the database
const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "tracker_db",
});
//defining and triggering//a callback funtion, as its a method running a function, its a function within a function so therefore it is a callback function.
db.connect(function (error) {
	if (error) throw error; //alternately could console log the error. if and throw are built in for this scenario
	console.log("connected to database");
	mainMenu();
});
//MAIN MENU SELCTION
const mainMenu = () => {
	inquirer
		.prompt([
			{
				type: "list",
				name: "choice",
				message: "What would you like to do? (Use arrow keys to navigate)",
				choices: [
					"View All Employees",
					"Add Employee",
					"Update Employee Role",
					"View All Roles",
					"Add Role (DOES NOT WORK)",
					"View All Departments",
					"Add Department",
				],
			},
		])
		.then((response) => {
			if (response.choice === "View All Employees") {
				viewAllEmployees(); //run viewAllEmployees
			} else if (response.choice === "Add Employee") {
				addEmployee(); //run addEmployee
			} else if (response.choice === "Update Employee Role") {
				updateEmployeeRole(); //run updateEmployeeRole
			} else if (response.choice === "View All Roles") {
				viewAllRoles(); //run viewAllRoles
			} else if (response.choice === "Add Role") {
				addRole(); //run addRole
			} else if (response.choice === "View All Departments") {
				viewAllDepartments(); //run viewAllDepartments
			} else if (response.choice === "Add Department") {
				addDepartment(); //run addDepartment
			}
		});
	console.log(`\n`); //hoefully adds a line in the console
};

//VIEW ALL EMPLOYEES
const viewAllEmployees = () => {
	db.query("SELECT * FROM employees", function (err, results) {
		console.table(results);
	});
	mainMenu();
};
//VIEW ALL Roles
const viewAllRoles = () => {
	db.query("SELECT * FROM role", function (err, results) {
		console.table(results);
	});
	mainMenu();
};
//VIEW ALL departments
const viewAllDepartments = () => {
	db.query("SELECT * FROM departments", function (err, results) {
		console.table(results);
	});
	mainMenu();
};

//ADD AN EMPLOYEE
const addEmployee = async () => {
	//await prevents code from running ahead before the query returns the promise.
	//gets the titles only (roles) and gives them to a new array called rolesArray
	const roles = await db.promise().query("SELECT * FROM role");
	//console.log(roles);
	const rolesArray = roles[0].map((role) => ({
		name: role.title,
		value: role.id,
	}));
	//gets the managers only (manager_id) and gives them to a new array called managerArray
	const everyone = await db.promise().query("SELECT * FROM employees");
	//console.log("console logging roles array ", rolesArray);
	const managersArray = everyone[0].map((employees) => ({
		name: employees.first_name + " " + employees.last_name,
		value: employees.id,
	}));
	inquirer
		.prompt([
			{
				type: "input",
				message: "What is the employee's first name?",
				name: "firstName",
			},
			{
				type: "input",
				message: "What is the employee's last name?",
				name: "lastName",
			},
			{
				type: "list",
				name: "role",
				message: "What is the employee's role? (select from list)",
				choices: rolesArray, //the user will see role.title, but inquirer will actually hand over role.id. Like a boss.
			},
			{
				type: "list",
				name: "employeeManager",
				message: "Who is the employee's manager? (select from list)",
				choices: managersArray,
			},
		])
		.then((answers) => {
			db.query(
				"INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (? ,? ,? ,? )",
				[
					answers.firstName, //first ?
					answers.lastName, //second ?
					answers.role, //third ?
					answers.employeeManager, //4th ? from above
				],
				function (err, results) {
					if (err) throw err;
					//console.table(results);
					console.log(`\n`);
					console.log(
						"---->YOUR NEW EMPLOYEE HAS BEEN ADDED TO 'ALL EMPLOYEES'.<----"
					);
					console.log(`\n`);
					mainMenu();
				}
			);
		});
};

//UPDATE AN EMPLOYEE ROLE
const updateEmployeeRole = async () => {
	const everyone = await db.promise().query("SELECT * FROM employees");
	//the name value pairs in the everyoneArray are coming from the mapping of "employees" from "everyone""
	//
	const everyoneArray = everyone[0].map((employees) => ({
		name: employees.first_name + " " + employees.last_name,
		value: employees.id, //the answer value that inquirer will use for "Which Employee's role would you like to update?"
	}));
	const roles = await db.promise().query("SELECT * FROM role");
	//console.log(roles);
	const rolesArray = roles[0].map((role) => ({
		name: role.title,
		value: role.id, //the answer value that inquirer will use for "what is the employee's new role?""
	}));
	inquirer
		.prompt([
			{
				type: "list",
				name: "whichEmployee",
				message: "Which Employee's role would you like to update?",
				choices: everyoneArray, //user will see employees.first_name + " " + employees.last_name but inquirer will hand over employees.id
			},
			{
				type: "list",
				name: "role",
				message: "What is the employee's new role? (select from list)",
				choices: rolesArray, //the user will see role.title, but inquirer will actually hand over role.id.
			},
		])
		.then((answers) => {
			console.log(answers);
			//answers.role and answers.whichEmployee will actually give the query employeee role_id and employee id
			db.query(
				`UPDATE employees SET role_id = ${answers.role} WHERE id = ${answers.whichEmployee}`
			),
				console.log(`\n`);
			console.log("----> YOUR EMPLOYEE HAS BEEN ASSIGNED A NEW ROLE! <----");
			console.log(`\n`);
			mainMenu();
		});
};

//ADD A ROLE (NOT WORKING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!)
const addRole = async () => {
	//the name value pairs in the departmentArray are from the mapping of departments from departmentList
	const departments = await db.promise().query("SELECT * FROM departments");
	console.log(departments);
	const departmentArray = departments[0].map((departments) => ({
		name: departments.deptname,
		value: departments.id, //this will be the department id, needed in later update query to the role table
	}));
	console.log(departmentArray);
	inquirer
		.prompt([
			{
				type: "input",
				message: "What is the name of the role?",
				name: "title",
			},
			{
				type: "input",
				message: "What is the salary of the role?",
				name: "salary",
			},
			{
				type: "list",
				name: "department",
				message: "Which department does the role belong to?",
				choices: departmentArray, //should get the value of the department id
			},
		])
		.then((answers) => {
			db.query(
				"INSERT INTO role (title, department_id, salary) VALUES (? ,? ,? )",
				[
					answers.title, //first ?
					answers.salary, //second ?
					answers.department, //third ?
				],
				function (err, results) {
					if (err) throw err;
					//console.table(results);
					console.log(`\n`);
					console.log("---->YOUR NEW ROLE HAS BEEN ADDED!.<----");
					console.log(`\n`);
					mainMenu();
				}
			);
		});
};

//ADD A DEPARTMENT
const addDepartment = async () => {
	inquirer
		.prompt([
			{
				type: "input",
				message: "What is the name of the new department?",
				name: "newDept",
			},
		])
		.then((answers) => {
			db.query(
				"INSERT INTO DEPARTMENTS (deptname) VALUES (?)",
				[answers.newDept],
				function (err, results) {
					if (err) throw err;
					console.table(results);
					console.log(`\n`);
					console.log(
						"---->YOUR NEW DEPARTMENT HAS BEEN ADDED TO 'DEPARTMENTS'.<----"
					);
					console.log(`\n`);
					mainMenu();
				}
			);
		});
};
