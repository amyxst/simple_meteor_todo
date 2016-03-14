Todos = new Mongo.Collection('todos');
Lists = new Mongo.Collection('lists');

Router.configure({ // options here will apply to all routes
  layoutTemplate: 'main'
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
      Todos.insert({
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
      });

      $('[name="todoName"]').val('');
    }
  });

  Template.todoItem.events({
    'click .delete-todo': function(event){
      event.preventDefault();
      var documentId = this._id;

      var confirm = window.confirm("Delete this task?");
      if (confirm) {
        Todos.remove({ _id: documentId });
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
        Todos.update({ _id: documentId },
                     {$set: { name: todoItem }});
        console.log(event.which);
      }
    },

    'change [type=checkbox]': function() { // QUESTION: why no events parameter here? ANSWER: not using events here
      var documentId = this._id;
      var isCompleted = this.completed;

      if (isCompleted) {
        Todos.update({ _id: documentId },
                      {$set: { completed: false }});
        console.log("Task marked as incomplete.");
      }
      else {
        Todos.update({ _id: documentId },
                      {$set: { completed: true }});
        console.log("Taks marked as complete.");
      }
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
      var currentUser = Meteor.userId();
      Lists.insert({
        name: listName,
        createdBy: currentUser
      }, function(error, results){
        Router.go('listPage', { _id: results }); // passing in param of _id (results) to route
      });
      $('[name=listName]').val('');
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
      var email = $('[name=email]').val();
      var password = $('[name=password').val();
      Accounts.createUser({
        email: email,
        password: password
      }, function(error) {
        if (error) {
          console.log(error.reason);
        }
        else {
          Router.go("home");
        }
      });
    }
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
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Meteor.loginWithPassword(email, password, function(error) {
        if (error) {
          console.log(error.reason);
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

}

if (Meteor.isServer) {

}

Router.route('/register');
Router.route('/login');
Router.route('/', { // need to manually associate '/' with home
  name: 'home',
  template: 'home'

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
  onRun: function() {
    console.log("You triggered 'onRun' for 'listPage' route.");
    this.next();
  },
  onRerun: function(){
        console.log("You triggered 'onRerun' for 'listPage' route.");
  },
  onBeforeAction: function(){
      console.log("You triggered 'onBeforeAction' for 'listPage' route.");
      var currentUser = Meteor.userId();
      if(currentUser){
          this.next();
      } else {
          this.render("login");
      }
  },
  onAfterAction: function(){
      console.log("You triggered 'onAfterAction' for 'listPage' route.");
  },
  onStop: function(){
      console.log("You triggered 'onStop' for 'listPage' route.");
  }
});


/* todo:
- check the params for find
- types of events that can be handled
- jQuery for selecting DOM elements


notes:
- route.go vs. render (latter does not redirect)

*/

