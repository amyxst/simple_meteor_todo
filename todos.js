Todos = new Mongo.Collection('todos');
Lists = new Mongo.Collection('lists');

Router.configure({ // options here will apply to all routes
  layoutTemplate: 'main',
  loadingTemplate: 'loading'

});

if (Meteor.isClient) {


  Template.todos.helpers({
    'todo': function() {
      var currentList = this._id;
      var currentUser = Meteor.userId();
      return Todos.find({ listId: currentList, createdBy: currentUser }, {sort: {createdAt: -1}});
    }
  });

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault(); // prevents page from refreshing upon submit
      var todoName = $('[name="todoName"]').val(); // alt: event.target.todoName.value
      var currentUser = Meteor.userId();
      var currentList = this._id; // gets the list ID from including {{todos}} in listPage (trickles down)
      Meteor.call('createNewTodo', currentList, todoName, function(error, results) {
        if (error) {
          console.log(error.reason);
        }
        else {
          $('[name="todoName"]').val('');
        }
      });

    }
  });

  Template.todoItem.events({
    'click .delete-todo': function(event){
      event.preventDefault();
      var documentId = this._id;

      var confirm = window.confirm("Delete this task?");
      if (confirm) {
        Meteor.call('removeTodo', documentId, function(error, results) {
          if (error) {
            console.log(error.reason);
          }
          else {
            console.log("Deleted todo!");
          }
        });
      }
    },

    'keyup [name="todoItem"]': function(event){
      if (event.which == 13 || event.which == 27) {
        console.log("You tapped the return or escape key");
        $(event.target).blur();
      }
      else {
        var documentId = this._id;
        var todoItem = $(event.target).val(); // target: get element that triggered event

        var isCompleted = this.completed;

        if (!isCompleted) {
          Meteor.call('updateTodoItem', documentId, todoItem, function(error, results) {
            if (error) {
              console.log(error.reason);
            }
            else {
              console.log("Changed todo!");
            }
          });
        }
        // console.log(event.which);
      }
    },

    'change [type=checkbox]': function() { // QUESTION: why no events parameter here? ANSWER: not using events here
      var documentId = this._id;
      var isCompleted = this.completed;

      Meteor.call('changeTodoStatus', documentId, isCompleted, function(error, response) {
        if (error) {
          console.log(error.reason);
        }
      });
    }

  });

  Template.todoItem.helpers({
    'checked': function() {
      var isCompleted = this.completed;
      if (isCompleted) {
        return "checked";
      }
      else {
        return "";''
      }
    }

  });

  Template.todosCount.helpers({
    'totalTodos': function() {
      var currentList = this._id;
      return Todos.find({ listId: currentList }).count(); // count() counts total # of items

    },

    'completedTodos': function() {
      var currentList = this._id;
      return Todos.find({ listId: currentList, completed: true }).count();

    }

  });

  Template.addList.events({
    'submit form': function(event) {
      event.preventDefault();
      var listName = $('[name=listName]').val();

      Meteor.call('createNewList', listName, function(error, results) {
        if (error) {
          console.log(error.reason);
        }
        else {
          Router.go('listPage', { _id: results });
          $('[name=listName]').val('');
        }
      });
      // var currentUser = Meteor.userId();
      // Lists.insert({
      //   name: listName,
      //   createdBy: currentUser
      // }, function(error, results){
      //   Router.go('listPage', { _id: results }); // passing in param of _id (results) to route
      // });
    }
  });

  Template.lists.helpers({
    'list': function(){
      var currentUser = Meteor.userId();
      return Lists.find({ createdBy: currentUser }, {sort: {name: 1}});
    }
  });

  Template.register.events({
    'submit form': function() {
      event.preventDefault();
      
    }
  });

  Template.register.onRendered(function() {
    $('.register').validate({
      submitHandler: function(event) {
        var email = $('[name=email]').val();
        var password = $('[name=password').val();
        Accounts.createUser({
          email: email,
          password: password
        }, function(error) {
          if (error) {
            if (error.reason == "Email already exists.") {
              validator.showErrors({
                email: "That email already belongs to a registered user."
              });
            }
          }
          else {
            Router.go("home");
          }
        });
      }
    });
  });

  Template.navigation.events({
    'click .logout': function(event) {
      event.preventDefault();
      Meteor.logout(); // default accounts-password
      Router.go('login');
    }
  });

  Template.login.events({
    'submit form': function(event) {
      event.preventDefault();
      
    }
  });

  Template.login.onCreated(function() {
    console.log("The login template was just created");
  });

  Template.login.onRendered(function() {
    $('.login').validate({
      submitHandler: function(event) { // executes when associated form is submitted
        var email = $('[name=email]').val();
        var password = $('[name=password]').val();
        Meteor.loginWithPassword(email, password, function(error) {
          if (error) {
            if(error.reason == "User not found"){
              validator.showErrors({
                  email: "That email doesn't belong to a registered user."   
              });
            }
            if(error.reason == "Incorrect password"){
              validator.showErrors({
                  password: "You entered an incorrect password."    
              });
            }
          }
          else {
            var currentRoute = Router.current().route.getName();
            if (currentRoute == "login") {
              Router.go("home"); // only redirect to home if at login page, otherwise stay at rounte
            } // QUESTION: after user logs in, then is the rendering of the route (i.e. not login) handled by if (currentUser), this.next()?
          }
        });
      }
    });
  });

  Template.login.onDestroyed(function() {
    console.log("The login template was just destroyed");
  });

  $.validator.setDefaults({
    rules: {
      email: {
        required: true,
        email: true
      },
      password: {
        required: true,
        minlength: 6
      }

    },
    messages: {
      email: {
        required: "You must enter an email address.",
        email: "You've entered an invalid email address."
      },
      password: {
        required: "You must enter a password.",
        minlength: "Your password must be at least {0} characters."
      }
    }
  });

}

if (Meteor.isServer) {
  Meteor.publish('lists', function() {
    var currentUser = this.userId; // again, this.userId as opposed to Meteor.userId is used in publish
    return Lists.find({ createdBy: currentUser });
  }); // 'lists' is arbitrary name to refer to

  Meteor.publish('todos', function(currentList) {
    var currentUser = this.userId;
    return Todos.find({ createdBy: currentUser, listId: currentList });
  });

  Meteor.methods({
    'createNewList': function(listName) {
      check(listName, String); // error will be thrown automatically if types don't match
      var currentUser = Meteor.userId();
      if (listName == "") {
        listName = defaultName(currentUser);
      }
      var data = {
        name: listName,
        createdBy: currentUser
      }
      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You are not logged in!"); // is there a set of built-in identifiers?
      }
      return Lists.insert(data);
    },

    'createNewTodo': function(currentList, todoName) {
      check(todoName, String);
      var currentUser = Meteor.userId();

      var data = {
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
      };

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You are not logged in!"); // is there a set of built-in identifiers?
      }

      return Todos.insert(data);
    },

    'changeTodoStatus': function(documentId, isCompleted) {
      check(isCompleted, Boolean);
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You are not logged in!"); // is there a set of built-in identifiers?
      }

      return Todos.update(data, {$set: { completed: isCompleted }});

    },

    'updateTodoItem': function(documentId, todoItem) {
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You are not logged in!"); // is there a set of built-in identifiers?
      }

      return Todos.update(data, {$set: { name: todoItem }}); // query both documentId and created by currentUser; is latter necessary?
    },

    'removeTodo': function(documentId) {
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You are not logged in!"); // is there a set of built-in identifiers?
      }

      return Todos.remove(data);
    }

  });

  function defaultName(currentUser) {
    var nextLetter = 'A'; // guessing that this var persists after function executes?
    var nextName = 'List ' + nextLetter;
    while (Lists.findOne({ name: nextName, createdBy: currentUser })) {
        nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
        nextName = 'List ' + nextLetter;
    }
    return nextName;
  }

}

Router.route('/register');
Router.route('/login');
Router.route('/', { // need to manually associate '/' with home
  name: 'home',
  template: 'home',
  waitOn: function() {
    return Meteor.subscribe('lists');
  }
});
Router.route('/list/:_id', {
  name: 'listPage',
  template: 'listPage',
  data: function() {
    var currentList = this.params._id;
    var currentUser = Meteor.userId();
    return Lists.findOne({ _id: currentList, createdBy: currentUser });
    // console.log(this.params.someParameter); // params is what you type in the browser
  },
  // onRun: function() {
  //   console.log("You triggered 'onRun' for 'listPage' route.");
  //   this.next();
  // },
  // onRerun: function(){
  //       console.log("You triggered 'onRerun' for 'listPage' route.");
  // },
  onBeforeAction: function(){
      console.log("You triggered 'onBeforeAction' for 'listPage' route.");
      var currentUser = Meteor.userId();
      if(currentUser){
          this.next();
      } else {
          this.render("login");
      }
  },
  waitOn: function() {
    var currentList = this.params._id;
    return [ Meteor.subscribe('lists'), Meteor.subscribe('todos', currentList) ]; // ** need to return
  // },
  // onAfterAction: function(){
  //     console.log("You triggered 'onAfterAction' for 'listPage' route.");
  // },
  // onStop: function(){
  //     console.log("You triggered 'onStop' for 'listPage' route.");
  }
});


/* todo:
- check the params for find
- types of events that can be handled
- jQuery for selecting DOM elements


notes:
- route.go vs. render (latter does not redirect)

*/

