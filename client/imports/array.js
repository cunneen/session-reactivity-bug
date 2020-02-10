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

  Session.setDefault("document", { arrayItems: [] });
  ItemsColl.remove({}, function (err) { // remove all
    if (err) {
      console.error(err);
    } else {
      const objToInsert = { foo: "bar", arrayItems: [{ key: "a" }, { key: "b" }, { key: "c" }] };
      ItemsColl.insert(objToInsert,
        function (error, newID) {
          if (buggyBehaviour) { // use session for reactivity rather than using collection directly
            objToInsert._id = newID;
            Session.set("document", objToInsert);
          }
        });
    }

  });
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
      const document = ItemsColl.findOne(evt.from.getAttribute("data-item-id"));
      const arrayItems = document.arrayItems;
      const id = document._id;

      const element = arrayItems[evt.oldIndex];
      arrayItems.splice(evt.oldIndex, 1); // remove 1 thing from items, starting at index oldIndex (i.e. just remove it)
      arrayItems.splice(evt.newIndex, 0, element); // remove 0 things from items, then starting at newIndex insert element.
      ItemsColl.update({ "_id": id }, { "$unset": { arrayItems: 1 } }
        , function (error, numUpdated) {
          if (numUpdated) {
            ItemsColl.update({ "_id": id }, { "$set": { arrayItems: arrayItems } },
              function (error2, numUpdated2) {
                if (Session.get("buggyBehaviour")) { // use the Session var for reactivity
                  if (numUpdated2) {
                    Session.set("document", ItemsColl.findOne(id))
                  }
                }
              });
          }
        }
      );
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