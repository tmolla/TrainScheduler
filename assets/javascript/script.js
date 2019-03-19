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
var newRecord = false;
var counter = 0

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


function displayRecord(sp){
    
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
}

function validate(newTrain){
    var validationError = false;
    
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
        $("#trainFrequencyError").html("Frequency must be a valid number with 2 digits (MM)");
        validationError = true;
    }
    else {
        $("#trainFrequencyError").html("");
    }

    return(!validationError)
}

$(".addData").on("click", function (event) {

    event.preventDefault();

    var newTrain = {
       name: $("#formGroupTrainName").val().trim(),
       destination: $("#formGroupDestination").val().trim(),
       firstTime: $("#formGroupFirstTrainTime").val().trim(),
       frequency: $("#formGroupFrequency").val().trim(),
       lastUpdated: firebase.database.ServerValue.TIMESTAMP
    };

    if (validate(newTrain)) {
        if (newRecord){
            console.log("Adding New record");
            database.ref().push(newTrain);
            $(".add").hide();
            $(".schedule").show();
        } else {
            console.log("updating from .addData")
            $('.'+$(this).attr('data-key')).remove()
            database.ref().child($(this).attr('data-key')).update(newTrain)
            database.ref($(this).attr('data-key')).once("value").then(function(sp) {displayRecord(sp)});
            $(".add").hide();
            $(".schedule").show();
        }
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
    newRecord = false;
    $(".schedule").hide();
    database.ref($(this).attr('data-key'))
    .once("value").then(function(sp) {
        $("#formGroupTrainName").val(sp.val().name);
        $("#formGroupDestination").val(sp.val().destination);
        $("#formGroupFirstTrainTime").val(sp.val().firstTime);
        $("#formGroupFrequency").val(sp.val().frequency);
      });
    $(".addData").attr("data-key", $(this).attr('data-key'));
    $(".add").show();
});

$(".cancelBtn").on("click", function(){
    $(".add").hide();
    $(".schedule").show();
})

$(".addTrain").on("click", function(){
    newRecord = true;
    $("#formGroupTrainName").val("");
    $("#formGroupDestination").val("");
    $("#formGroupFirstTrainTime").val("");
    $("#formGroupFrequency").val("");
    $(".add").show();
    $(".schedule").hide();
})


database.ref().on("child_added", function(sp) {
    displayRecord(sp);
    //console.log("in added event ")
}, function(error) {
    console.log("Error: " + error.code);
});

database.ref().on("child_removed", function(sp){
    //console.log("in remove event")
    $('.'+sp.key).remove()
});

/* database.ref().on("child_changed", function(sp){
    console.log("in changed event")
    //alert("Hey child changed " + sp.key)
    //displayRecord(sp);
}); */

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

