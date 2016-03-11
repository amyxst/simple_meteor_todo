Todos = new Mongo.Collection('todos');
Lists = new Mongo.Collection('lists');

Router.configure({ // options here will apply to all routes
  layoutTemplate: 'main'
});

if (Meteor.isClient) {

  Template.todos.helpers({
    'todo': function() {
      var currentList = this._id;
      return Todos.find({ listId: currentList }, {sort: {createdAt: -1}});
    }
  });

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault(); // prevents page from refreshing upon submit
      var todoName = $('[name="todoName"]').val(); // alt: event.target.todoName.value
      currentList = this._id; // gets the list ID from including {{todos}} in listPage (trickles down)
      Todos.insert({
        name: todoName,
        completed: false,
        createdAt: new Date(),
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
      Lists.insert({
        name: listName
      }, function(error, results){
        Router.go('listPage', { _id: results }); // passing in param of _id (results) to route
      });
      $('[name=listName]').val('');
    }
  });

  Template.lists.helpers({
    'list': function(){
      return Lists.find({}, {sort: {name: 1}});
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
    return Lists.findOne({ _id: currentList });
    // console.log(this.params.someParameter); // params is what you type in the browser
  }
});


/* todo:
- check the params for find
- types of events that can be handled
- jQuery for selecting DOM elements

*/

