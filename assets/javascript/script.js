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

$(".btn-primary").on("click", function (event) {
    event.preventDefault();

    var newTrain = {
       name: $("#formGroupTrainName").val().trim(),
       destination: $("#formGroupDestination").val().trim(),
       firstTime: $("#formGroupFirstTrainTime").val().trim(),
       frequency: $("#formGroupFrequency").val().trim(),
       dateAdded: firebase.database.ServerValue.TIMESTAMP
    };
    database.ref().push(newTrain);

    $(".add").hide();
    $(".schedule").show();
});


$(".addTrain").on("click", function(){
    $(".add").show();
    $(".schedule").hide();
})


database.ref().on("child_added", function(sp) {
    var tfrequency = sp.val().frequency;
    var tFirstTime = sp.val().firstTime; 
    var row = '<tr><td><span class="fas fa-pencil-alt float-left"></span></td>' +
    '<td><span class="fas fa-trash float-left"></span></td>' +
    '<td>'+ sp.val().name + '</td>' +
    '<td>'+ sp.val().destination + '</td>' +
    '<td>'+ tfrequency + '</td>' +
    '<td>'+ nextArrivalTime(tFirstTime, tfrequency) + '</td>' +
    '<td>'+ minutesAway(tFirstTime, tfrequency) + '</td></tr>'; 
    $("table tbody").append(row) 
}, function(error) {
    console.log("Error: " + error.code);
});

$(document).ready(function(){
    $(".add").hide();
    $(".schedule").show();
});
