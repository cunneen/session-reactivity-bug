const EXHIBIT_BUGGY_BEHAVIOUR = false; // 

import { Mongo } from "meteor/mongo";
import { Template } from 'meteor/templating';
// Default SortableJS
import Sortable from 'sortablejs';

import "./array.html";
import "./array.css";

const ItemsColl = new Mongo.Collection();

/**
 * clear the local collection and session var, and start again.
 * @param {boolean} EXHIBIT_BUGGY_BEHAVIOUR - set to true to use the buggy reactive 'Session' behaviour
 */
const initialize = function () {
  const buggyBehaviour = Session.get("buggyBehaviour");
  console.log(`EXHIBIT_BUGGY_BEHAVIOUR IS SET TO ${buggyBehaviour}`);

  const objToInsert = { foo: "bar", arrayItems: [{ key: "a" }, { key: "b" }, { key: "c" }] };

  if (buggyBehaviour) {
    Session.setDefault("document", objToInsert);
  } else {
    ItemsColl.remove({}, function (err) { // remove all
      if (err) {
        console.error(err);
      } else { // like the highlander, there can be only one. Probably Sean Connery.
        ItemsColl.insert(objToInsert);
      }  
    });
  }
}

// ==== sortablejs
const setupSortable = function (elem) {
  console.log(`setupSortable`);
  return new Sortable(elem, {
    group: "fieldOptions",  // or { name: "...", pull: [true, false, 'clone', array], put: [true, false, array] }     // examples.
    draggable: ".sortable-item",  // Specifies which items inside the element should be draggable
    dataIdAttr: "data-option-id",
    swapThreshold: 1,
    fallbackOnBody: true,
    animation: 150,

    // Element dragging ended; update the collection (and possibly the session var)
    onEnd: function (/**Event*/evt) {
      let document;
      if (Session.get("buggyBehaviour")) {
        document = Session.get("document");
      } else { // from local collection
        document = ItemsColl.findOne(evt.from.getAttribute("data-item-id"));
      }
      const arrayItems = document.arrayItems;
      const id = document._id; // will be undefined for Session variant

      const element = arrayItems[evt.oldIndex];
      arrayItems.splice(evt.oldIndex, 1); // remove 1 thing from items, starting at index oldIndex (i.e. just remove it)
      arrayItems.splice(evt.newIndex, 0, element); // remove 0 things from items, then starting at newIndex insert element.

      if (Session.get("buggyBehaviour")) { // update doc on session
        // first set the Session document to an object WITHOUT the array -- why do we even have to do this?
        const docCloneWithoutArrayItems = JSON.parse(JSON.stringify(document));
        delete docCloneWithoutArrayItems.arrayItems;
        Session.set("document", docCloneWithoutArrayItems);
        
        // now set the Session document to an object WITH the updated array
        // This works -- ONE MILLISECOND!!! :
        // setTimeout(function() {Session.set("document", document);}, 1);
        // This doesn't work
        Session.set("document", document);
      } else { // update doc in local collection
        // first update the local collection doc to be WITHOUT the array -- why do we even have to do this?
        ItemsColl.update({ "_id": id }, { "$unset": { arrayItems: 1 } }
          , function (error, numUpdated) {
            if (numUpdated) {
              // then add the array items back again.
              ItemsColl.update({ "_id": id }, { "$set": { arrayItems: arrayItems } });
            }
          }
        );
      }
    }
  });
}

Meteor.startup(() => {
  Session.setDefault("buggyBehaviour", true)
  initialize();
});

Template.array.helpers({
  dataItem: () => { // returns the item from session if "buggyBehaviour" is set, otherwise from the local collection
    let dataItem;
    if (Session.get("buggyBehaviour")) { // use the Session variable
      dataItem = Session.get("document");
    } else {
      dataItem = ItemsColl.findOne(); // use collection directly
    }
    console.log(`dataItem returning: ${JSON.stringify(dataItem)}`);
    return dataItem;
  },
  isBuggySelected: () => {
    return Session.get("buggyBehaviour");
  }
});

Template.array.events({
  // toggle between buggy behaviour and reliable behaviour. Re-initialize after toggle.
  'click #exhibit-buggy-behaviour': function (evt, template) {
    const isChecked = template.$(evt.target).prop("checked");
    Session.set("buggyBehaviour", isChecked);
    initialize();
  }
});

Template.arraySortable.onRendered(function () {
  setupSortable(this.$(".sortable")[0]);
});