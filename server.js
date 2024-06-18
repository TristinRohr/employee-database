const inquirer = require('inquirer');
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'company_db',
    password: 'tr5796',
    port: 5432,
});

client.connect();

const mainMenu = () => {
    inquirer.prompt({
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
            'View All Departments',
            'View All Roles',
            'View All Employees',
            'Add a Department',
            'Add a Role',
            'Add an Employee',
            'Update an Employee Role',
            'View Employees by Department',
            'Delete a Department',
            'Delete a Role',
            'Delete an Employee',
            'Exit'
        ]
    }).then(answer => {
        switch (answer.action) {
            case 'View All Departments':
                viewDepartments();
                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'View All Employees':
                viewEmployees();
                break;
            case 'Add a Department':
                addDepartment();
                break;
            case 'Add a Role':
                addRole();
                break;
            case 'Add an Employee':
                addEmployee();
                break;
            case 'Update an Employee Role':
                updateEmployeeRole();
                break;
            case 'Update Employee Manager':
                updateEmployeeManager();
                break;
            case 'View Employees by Manager':
                viewEmployeesByManager();
                break;
            case 'View Employees by Department':
                viewEmployeesByDepartment();
                break;
            case 'Delete a Department':
                deleteDepartment();
                break;
            case 'Delete a Role':
                deleteRole();
                break;
            case 'Delete an Employee':
                deleteEmployee();
                break;
            case 'View Department Budget':
                viewDepartmentBudget();
                break;
            case 'Exit':
                client.end();
                break;
        }
    });
};

const viewDepartments = () => {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.table(res.rows);
            mainMenu();
        }
    });
};

const viewRoles = () => {
    client.query(`SELECT roles.id, roles.title, departments.name AS department, roles.salary 
                  FROM roles 
                  JOIN departments ON roles.department_id = departments.id`, (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.table(res.rows);
            mainMenu();
        }
    });
};

const viewEmployees = () => {
    client.query(`SELECT employees.id, employees.first_name, employees.last_name, roles.title, 
                         departments.name AS department, roles.salary, 
                         CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                  FROM employees 
                  JOIN roles ON employees.role_id = roles.id 
                  JOIN departments ON roles.department_id = departments.id 
                  LEFT JOIN employees manager ON employees.manager_id = manager.id`, (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.table(res.rows);
            mainMenu();
        }
    });
};

const addDepartment = () => {
    inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:'
    }).then(answer => {
        client.query('INSERT INTO departments (name) VALUES ($1)', [answer.name], (err, res) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Department added successfully');
                mainMenu();
            }
        });
    });
};

const addRole = () => {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const departments = res.rows.map(department => ({
                name: department.name,
                value: department.id
            }));
            departments.push({ name: 'All Departments', value: 'all' }); // Add option for all departments

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: 'Enter the title of the role:'
                },
                {
                    type: 'input',
                    name: 'salary',
                    message: 'Enter the salary for the role:'
                },
                {
                    type: 'list',
                    name: 'department_id',
                    message: 'Select the department for the role:',
                    choices: departments
                }
            ]).then(answers => {
                const { title, salary, department_id } = answers;
                if (department_id === 'all') {
                    client.query('SELECT id FROM departments', (err, res) => {
                        if (err) {
                            console.error(err);
                        } else {
                            const departmentIds = res.rows.map(row => row.id);
                            const queries = departmentIds.map(id => {
                                return client.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, id]);
                            });
                            Promise.all(queries)
                                .then(() => {
                                    console.log('Role added to all departments successfully');
                                    mainMenu();
                                })
                                .catch(err => {
                                    console.error(err);
                                    mainMenu();
                                });
                        }
                    });
                } else {
                    client.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id], (err, res) => {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log('Role added successfully');
                            mainMenu();
                        }
                    });
                }
            }).catch(err => {
                console.error("Error in add role prompt:", err);
            });
        }
    });
};

const addEmployee = () => {
    client.query(`SELECT roles.id, roles.title, departments.name AS department 
                  FROM roles 
                  JOIN departments ON roles.department_id = departments.id`, (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const roles = res.rows.map(role => ({
                name: `${role.title} (${role.department})`,
                value: role.id
            }));
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'first_name',
                    message: 'Enter the first name of the employee:'
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: 'Enter the last name of the employee:'
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'Select the role for the employee:',
                    choices: roles
                }
            ]).then(answers => {
                client.query('INSERT INTO employees (first_name, last_name, role_id) VALUES ($1, $2, $3)', 
                [answers.first_name, answers.last_name, answers.role_id], (err, res) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Employee added successfully');
                        mainMenu();
                    }
                });
            }).catch(err => {
                console.error("Error in add employee prompt:", err);
            });
        }
    });
};

const updateEmployeeRole = () => {
    client.query('SELECT * FROM employees', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const employees = res.rows.map(employee => ({
                name: `${employee.first_name} ${employee.last_name}`,
                value: employee.id
            }));
            client.query(`SELECT roles.id, roles.title, departments.name AS department 
                          FROM roles 
                          JOIN departments ON roles.department_id = departments.id`, (err, res) => {
                if (err) {
                    console.error(err);
                } else {
                    const roles = res.rows.map(role => ({
                        name: `${role.title} (${role.department})`,
                        value: role.id
                    }));
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'employee_id',
                            message: 'Select the employee you want to update:',
                            choices: employees
                        },
                        {
                            type: 'list',
                            name: 'role_id',
                            message: 'Select the new role for the employee:',
                            choices: roles
                        }
                    ]).then(answers => {
                        client.query('UPDATE employees SET role_id = $1 WHERE id = $2', 
                        [answers.role_id, answers.employee_id], (err, res) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Employee role updated successfully');
                                mainMenu();
                            }
                        });
                    }).catch(err => {
                        console.error("Error in update employee role prompt:", err);
                    });
                }
            });
        }
    });
};

const viewEmployeesByDepartment = () => {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const departments = res.rows.map(department => ({
                name: department.name,
                value: department.id
            }));
            inquirer.prompt({
                type: 'list',
                name: 'department_id',
                message: 'Select a department to view its employees:',
                choices: departments
            }).then(answer => {
                client.query(`SELECT employees.id, employees.first_name, employees.last_name, roles.title, roles.salary, 
                                     CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                              FROM employees 
                              JOIN roles ON employees.role_id = roles.id 
                              JOIN departments ON roles.department_id = departments.id 
                              LEFT JOIN employees manager ON employees.manager_id = manager.id 
                              WHERE departments.id = $1`, [answer.department_id], (err, res) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.table(res.rows);
                        mainMenu();
                    }
                });
            });
        }
    });
};

const deleteDepartment = () => {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const departments = res.rows.map(department => ({
                name: department.name,
                value: department.id
            }));
            inquirer.prompt({
                type: 'list',
                name: 'department_id',
                message: 'Select the department you want to delete:',
                choices: departments
            }).then(answer => {
                const departmentId = answer.department_id;

                // Reassign or delete roles and employees associated with the department
                client.query('DELETE FROM employees WHERE role_id IN (SELECT id FROM roles WHERE department_id = $1)', [departmentId], (err, res) => {
                    if (err) {
                        console.error(err);
                    } else {
                        client.query('DELETE FROM roles WHERE department_id = $1', [departmentId], (err, res) => {
                            if (err) {
                                console.error(err);
                            } else {
                                client.query('DELETE FROM departments WHERE id = $1', [departmentId], (err, res) => {
                                    if (err) {
                                        console.error(err);
                                    } else {
                                        console.log('Department deleted successfully');
                                        mainMenu();
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    });
};

const deleteRole = () => {
    client.query('SELECT * FROM roles', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const roles = res.rows.map(role => ({
                name: role.title,
                value: role.id
            }));
            inquirer.prompt({
                type: 'list',
                name: 'role_id',
                message: 'Select the role you want to delete:',
                choices: roles
            }).then(answer => {
                const roleId = answer.role_id;
                // Check if there are employees associated with this role
                client.query('SELECT * FROM employees WHERE role_id = $1', [roleId], (err, res) => {
                    if (err) {
                        console.error(err);
                    } else if (res.rows.length > 0) {
                        console.log(`There are ${res.rows.length} employees associated with this role.`);
                        inquirer.prompt({
                            type: 'list',
                            name: 'new_role_id',
                            message: 'Please reassign these employees to another role:',
                            choices: roles.filter(role => role.value !== roleId)
                        }).then(newRoleAnswer => {
                            const newRoleId = newRoleAnswer.new_role_id;
                            // Reassign employees
                            client.query('UPDATE employees SET role_id = $1 WHERE role_id = $2', [newRoleId, roleId], (err, res) => {
                                if (err) {
                                    console.error(err);
                                } else {
                                    // Now delete the role
                                    client.query('DELETE FROM roles WHERE id = $1', [roleId], (err, res) => {
                                        if (err) {
                                            console.error(err);
                                        } else {
                                            console.log('Role deleted successfully');
                                            mainMenu();
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        // No employees associated, can delete the role directly
                        client.query('DELETE FROM roles WHERE id = $1', [roleId], (err, res) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log('Role deleted successfully');
                                mainMenu();
                            }
                        });
                    }
                });
            });
        }
    });
};

const deleteEmployee = () => {
    client.query('SELECT * FROM employees', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            const employees = res.rows.map(employee => ({
                name: `${employee.first_name} ${employee.last_name}`,
                value: employee.id
            }));
            inquirer.prompt({
                type: 'list',
                name: 'employee_id',
                message: 'Select the employee you want to delete:',
                choices: employees
            }).then(answer => {
                client.query('DELETE FROM employees WHERE id = $1', [answer.employee_id], (err, res) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Employee deleted successfully');
                        mainMenu();
                    }
                });
            });
        }
    });
};

mainMenu();