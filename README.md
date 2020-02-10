# Meteor session reactivity bug

A demo of how meteor's Session reactivity is not properly handling reactive changes to array ordering in a document on the Session (whereas it works fine for documents in a local collection)

![session-reactivity-bug](https://user-images.githubusercontent.com/1751645/74130927-3929ec00-4c1e-11ea-97be-55b116c4f301.gif)

Enabling the checkbox uses a document on Session for reactivity, changing the order of its array elements. This doesn't work well.

Disabling the checkbox uses a local collection, clearing out its array and then re-setting it. This works well.