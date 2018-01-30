# Recoil
## Introduction
Recoil is a FRP library, with a few differences to standard FRP.

to build it use the recoil-build repository it includes closure and recoil. It does this in order to allow the compile to be staged outside the recoil repository.


## What is different to normal FRP
### Built in bidirectionality 
Recoil supports bidirectional behaviors built into the engine, I this allows the engine to control the flow of through the system better. I believe bidirectional behaviors allow for better abstraction of data types an a better way of thinking behaviors. The program is simply a view on data. A widget gets a behavior and its job is either set or display that data. It provides a cleaner method than dealing with output and input events which seem to lead to state driven code even outside the widget.

### Transactions
Behaviors and events change inside a transaction. Nothing gets propagated until that transaction has completed.

Here is an example where this is useful.

C is behavior that depends on A and B
A and B are both updated on the server and sent to the client
However if set either A or B first then C is temporarily in an inconsistent state resulting in errors, however if A and B are set in a transaction then neither propagates until both are done. 

### Built in errors
Every Behavior has meta data that comes with errors and a ready state, not although events implement this it really doesn't make sense for events so they are always ready and have no errors, although the events themselves can be errors.

This means the system can handle the errors itself no more prefixing each function with ``if (!isGood())``, not ready and errors will be propagated automatically.  You can do it yourself in the rare cases in which this is necessary using ``metaLiftB``.

### Different Events
In systems I have seen behaviors are events with states, in recoil events list of values that loose there state.

The reason they are a list of values is because of transactions, since an event may fire multiple times in a transaction.

This design leads no need for merge or map operations, the lift operation is enough. This greatly simplifies the code. Take for example merge, when you call merge you have no way of knowing what source the event came from, although they may be of different types so you end up having tag each event and place a in the map function afterwards.

```javascript
C = frp.merge(tag("a",A), tag("b", B))
    .map(function (e) {
        if (e.tag === "a") ...
        if (e.tag === "b") ...
    })
```
however with a lift you can directly get the source of the event
```javascript
C = frp.lift(function (a, b) {
       a.forEach(...)
       b.forEach(...)
    });
```
Also you may note you can combine events and behaviors in lift, there is no need to use valueNow (unsafeMetaGet in recoil) which effectively breaks the dependency tree in the FRP engine.
 
Note I have not needed events yet, so they are largely untested. 
### Stricter enforcement of dependencies
The system will error if you try to access a behavior that you are not meant to for example:
```javascript
A = frp.lift(function () {
   return B.get();
})
```
this is invalid since you have not specified by as a provider the correct way is:
```javascript
A = frp.lift(function (b) {
   return B.get();
},B)
```
You can use either the b, or B.get() to get the value although using b seems functionally more clean in practice B.get() can work better for large function since you have to maintain the order of the parameters passed and scroll down to the bottom to find out what exactly B is.

## Automatic garbage collection
FRP nodes are not calculated until they are attached, there is a [``recoil.frp.DomObserver``](https://github.com/evaks/recoil/blob/master/src/frp/domobserver.js) which will automatically attach detach the FRP based on the DOM's elements present in the document. You could implement this on the server side as well based on registration 
