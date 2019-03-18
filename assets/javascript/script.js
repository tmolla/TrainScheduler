  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyCuigfBbczrJwUOFp88IFHlhf5pX2qfUmQ",
    authDomain: "traintime-93a75.firebaseapp.com",
    databaseURL: "https://traintime-93a75.firebaseio.com",
    projectId: "traintime-93a75",
    storageBucket: "traintime-93a75.appspot.com",
    messagingSenderId: "434144199213"
  };
  firebase.initializeApp(config);

var database = firebase.database();
var timerIntervalID = "";
var counter = 0
var dataArray = [];

function calculateTimeRemainder(firstTime, frequency){
    // First Time (pushed back 1 year to make sure it comes before current time)
    var firstTimeConverted = moment(firstTime, "HH:mm").subtract(1, "years");
    var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
    return (diffTime % frequency);
};

function minutesAway(firstTime, frequency) {
    return (frequency - calculateTimeRemainder(firstTime, frequency));
}

function nextArrivalTime(firstTime, frequency){
    return(moment().add(minutesAway(firstTime, frequency), "minutes").format("hh:mm"));
}

function validateFormData(){
    var validate = false;
    return validate;
}

function displayRecord(sp){
    var row = {}
    row = {key:sp.key, value:sp.val()};

    //push each record into an array so we can use it with setInterval
    dataArray.push(row);
    var tfrequency = sp.val().frequency;
    var tFirstTime = sp.val().firstTime; 
    var row = $("<tr>");
    var cols = '<td><span class="fas fa-pencil-alt float-left" data-key="' + sp.key + '"></span></td>' +
    '<td><span class="fas fa-trash float-left" data-key="' + sp.key + '"></span></td>' +
    '<td>'+ sp.val().name + '</td>' +
    '<td>'+ sp.val().destination + '</td>' +
    '<td>'+ tfrequency + '</td>' +
    '<td>'+ nextArrivalTime(tFirstTime, tfrequency) + '</td>' +
    '<td>'+ minutesAway(tFirstTime, tfrequency) + '</td>'; 
    
    row.addClass(sp.key);
    row.attr("data-firstTime", tFirstTime)
    row.append(cols);
    $("table tbody").append(row) 
    //console.log(dataArray);
}

$(".addData").on("click", function (event) {

    event.preventDefault();
    var validationError = false;

    var newTrain = {
       name: $("#formGroupTrainName").val().trim(),
       destination: $("#formGroupDestination").val().trim(),
       firstTime: $("#formGroupFirstTrainTime").val().trim(),
       frequency: $("#formGroupFrequency").val().trim(),
       dateAdded: firebase.database.ServerValue.TIMESTAMP
    };

    if (!(newTrain.name.length > 0)) {  // validate name
        $("#trainNameError").html("Plase enter tain name.");
        validationError = true;
    }
    else{
        $("#trainNameError").html("");
    }
    
    if(!(newTrain.destination.length > 0)) { //validate destination
        $("#trainDestinationError").html("Plase enter Tain destination.");
        validationError = true;
    }  
    else{
        $("#trainDestinationError").html("");
    }

    if (!(newTrain.firstTime.length > 0)){ // validate First time
        $("#trainFirstTimeError").html("Plase enter train first time in military format (HH:MM).");
        validationError = true;
    } else if (!((newTrain.firstTime.length == 5) &&   // must be 5 chars long
                  (!(isNaN(newTrain.firstTime.substring(0,2)))) &&  // must have 2 digits followed by
                  (newTrain.firstTime.substring(2,3) == ":") &&     // the character ":" followed by
                  (!(isNaN(newTrain.firstTime.substring(3,5)))))){ // 2 digits
        validationError = true;
        $("#trainFirstTimeError").html("Train first time must be a valid in military format (HH:MM).");
    }else{
        $("#trainFirstTimeError").html("");
    }

    if (!(newTrain.frequency.length > 0)){ //validate frequency
        $("#trainFrequencyError").html("Plase enter frequency in minutes (MM)");
        validationError = true;
    } 
    else if (!((newTrain.frequency.length == 2) && (!(isNaN(newTrain.frequency))))){
        //alert(!((newTrain.frequency.length == 2) && (!(isNaN(newTrain.frequency)))))
        $("#trainFrequencyError").html("Frequency must be a valid number with 2 digits (MM)");
        validationError = true;
    }
    else {
        $("#trainFrequencyError").html("");
    }

    if (!validationError) {
        database.ref().push(newTrain);
        $(".add").hide();
        $(".update").hide();
        $(".schedule").show();
    }
    validationError = false;
});

$(document).on("click", ".fa-trash", function(){
    database.ref($(this).attr('data-key')).remove()
    .then(function() {
        console.log("Remove succeeded.")
    })
    .catch(function(error) {
        console.log("Remove failed: " + error.message)
    });
});

$(document).on("click", ".fa-pencil-alt", function(){
    //get record
    //alert("you touched the pencil")
    $(".schedule").hide();
    database.ref($(this).attr('data-key'))
    .once("value").then(function(sp) {
        $("#formGroupUpdateTrainName").val(sp.val().name);
        $("#formGroupUpdateDestination").val(sp.val().destination);
        $("#formGroupUpdateFirstTrainTime").val(sp.val().firstTime);
        $("#formGroupUpdateFrequency").val(sp.val().frequency);
        //console.log(sp.val().name);
        //console.log(sp.val().destination);
      });
    $(".updateData").attr("data-key", $(this).attr('data-key'));
    $(".update").show();
});

$(".updateData").on("click", function(){
    var updatedSchedule = {
        name: $("#formGroupUpdateTrainName").val().trim(),
        destination: $("#formGroupUpdateDestination").val().trim(),
        firstTime: $("#formGroupUpdateFirstTrainTime").val().trim(),
        frequency: $("#formGroupUpdateFrequency").val().trim(),
        dateUpdated: firebase.database.ServerValue.TIMESTAMP
    };
    console.log(updatedSchedule);
    console.log($(this).attr('data-key'))
    database.ref().child($(this).attr('data-key')).update(updatedSchedule)
    $(".update").hide();
    $(".schedule").show();
});


$(".addTrain").on("click", function(){
    $(".add").show();
    $(".schedule").hide();
})


database.ref().on("child_added", function(sp) {
    //console.log(sp.key);
    displayRecord(sp);
}, function(error) {
    console.log("Error: " + error.code);
});

database.ref().on("child_removed", function(sp){
    $('.'+sp.key).remove()
});

database.ref().on("child_changed", function(sp){
    //alert("Hey child changed " + sp.key)
});

$(document).ready(function(){
    $(".add").hide();
    $(".update").hide();
    $(".schedule").show();
    timerIntervalID = setInterval(updateTable, 10000);
});

function updateTable(){
    $('.table > tbody  > tr').each(function() {
        var tFirstTime = $(this).attr("data-firstTime");
        var tfrequency = (($(this).find('td:eq(4)').text()));
        $(this).find('td:eq(5)').html(nextArrivalTime(tFirstTime, tfrequency));       
        $(this).find('td:eq(6)').html(minutesAway(tFirstTime, tfrequency));
    });
}
$(document).on('click', 'tr', function(){
    //alert("you clicked on a row");
});
