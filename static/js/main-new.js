$(document).ready(function () {
  //contact form validation
  function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }
  // Get the current date
var currentDate = new Date();

// Get components of the date
var month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to month since it's zero-based
var day = currentDate.getDate().toString().padStart(2, '0');
var year = currentDate.getFullYear();

var hours = currentDate.getHours();
var minutes = currentDate.getMinutes().toString().padStart(2, '0');
var seconds = currentDate.getSeconds().toString().padStart(2, '0');
var ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12;
hours = hours ? hours : 12; // Handle 12-hour format

// Construct the formatted date string
var todayDate = month + '/' + day + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds + ' ' + ampm;

// Display the formatted date
// console.log(todayDate);


  var uid = uuidv4();
$('#contact-submit-live').click(function (e) {
  e.preventDefault();  
  var first_name = $('#name').val();
  var email = $('#email').val();
  var subject = $('#subject').val();
  var patientdetails = $('#patientoption').val();
  var message = $('#message').val();
  var o = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
  //console.log(" patientdetails -----------",first_name, email, subject, patientdetails);
 
  if (first_name == '') {
    $('#namealert').css('display', 'block');
    return false;
  }
  else {
    $('#namealert').css('display', 'none');
  }
  if (email == '' || email.search(o) == -1) {
    $('#emailalert').css('display', 'block');
    return false;
  }
  else {
    $('#emailalert').css('display', 'none');
  }
  if (subject == '') {
    $('#subjectalert').css('display', 'block');
    return false;
  }
  else {
    $('#subjectalert').css('display', 'none');
  }
  if (patientdetails == '') {
    $('#patientalert').css('display', 'block');
    return false;
  }
  else {
    $('#patientalert').css('display', 'none');
  }
  if(patientdetails == 'PA'){
    var patientdetailsvalue = 'PPA';
  } else if(patientdetails == 'HIM'){
    var patientdetailsvalue = 'HIM';
  } else {
    var patientdetailsvalue = '';
  }
  $('.loader-form').show();
  var concatenatedValues = first_name + "|" + email + "|" + patientdetailsvalue;

  var encodedValues = btoa(concatenatedValues);
  var NovuBaseURL = $('#_novbaseurl').val();
  var inviteurl = NovuBaseURL+'token='+encodedValues;
var registerFormData = {
  "name": "ubh-notify-user-registration",
  "to": {
      "subscriberId": email,
      "email": email,
      "firstName": first_name,
      "lastName": ""
  },
  "payload": {
      "invite_link": inviteurl,
      "registration_type": patientdetailsvalue,
      "registration_datetime": todayDate
  }
};
  var settings = {
    "url": "https://api.novu.infra.experimental.medigy.com/v1/events/trigger",
    "method": "POST",
    "timeout": 0,
    "headers": {
      "Authorization": "ApiKey 173122ce8b63e1199b61fb7ced626f8a",
      "Content-Type": "application/json"
    },
    "data": JSON.stringify(registerFormData),
};
// Make the API call
$.ajax(settings).done(function(response) {
  var form = new FormData();
  form.append("grant_type", "client_credentials");
  form.append("client_id", "220df659-3f88-9184-7aae-64d0ca060409");
  form.append("client_secret", "ioDlA7#09yyM");
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://devl-crm.unblock.health/Api/access_token",
    "method": "POST",
    "headers": {
      "Accept": "application/vnd.api+json"
    },
    "processData": false,
    "contentType": false,
    "mimeType": "multipart/form-data",
    "data": form
  }

  $.ajax(settings).done(function (response) {

    var obj = $.parseJSON(response);
    var access_token = obj.access_token;
    var settings = {
      "url": "https://devl-crm.unblock.health/Api/V8/module",
      "method": "POST",
      "headers": {
        "Accept": "application/vnd.api+json",
        "Authorization": "Bearer " + access_token + "",
        "Content-Type": "application/json"
      },
      "processData": false,
      "data": "{\r\n  \"data\": {\r\n    \"type\": \"Contacts\",\r\n    \"id\": \"" + uid + "\",\r\n    \"attributes\": {\r\n     \"first_name\":\"" + first_name + "\",\r\n     \"email1\":\"" + email + "\"\r\n,\r\n     \"lead_source\":\"Web Site\"\r\n,\r\n     \"title\":\"" + patientdetails + "\"\r\n   }\r\n  }\r\n}\r\n"
    }

    $.ajax(settings).done(function (response) {
      // console.log(response);
      var contactid = response.data.id;
      var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://devl-crm.unblock.health/Api/V8/module/Accounts/c548fc60-389f-8f5b-5ecb-64cce0924678/relationships",
        "method": "POST",
        "headers": {
          "Accept": "application/vnd.api+json",
          "Authorization": "Bearer " + access_token + "",
          "Content-Type": "application/json"
        },
        "processData": false,
        "data": "{  \r\n   \"data\":{  \r\n         \"type\":\"Contacts\",\r\n         \"id\":\"" + contactid + "\"\r\n\t    \r\n      }\r\n}"
      }

      $.ajax(settings).done(function (response) {
        // console.log(response);
        if (response.meta.message != "") {
          $('#name').val('');
          $('#email').val('');
          $('.loader-form').hide();
          var $success = $('#success'); // get the reference of the div
          $success.show().html('We appreciate your registration with Unblock Health.');
        }
      });
    });
  });
  // console.log("API call successful:", response);
}).fail(function(error) {
  console.error("API call error:", error);
});

});

$('#contact-submit-live').prop('disabled', 'disabled');
  $('#contact-submit-live').addClass('is-disabled');
  $('#quickcontact').on('blur keyup change', 'textarea,input,select', function (event) {
     quickContactValidation = validateForm('#quickcontact', '#contact-submit-live');
     if((quickContactValidation==true)&&($("#name").val().length > 0)&&($("#email").val().length > 0)&&($("#patientoption").val()=="PA" ||$("#patientoption").val()=="HIM")){ 
        $('#contact-submit-live').prop('disabled', false);
        $('#contact-submit-live').removeClass('is-disabled');
     }
  });

  $('#contact-submit').click(function (e) {
    e.preventDefault();
    var first_name = $('#quickname').val();
    var email = $('#quickemail').val();
    var subject = $('#quicksubject').val();
    var message = $('#quickmessage').val();
    var o = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
    if (first_name == '') {
      $('#quicknamealert').css('display', 'block');
      return false;
    }
    else {
      $('#quicknamealert').css('display', 'none');
    }
    if (email == '' || email.search(o) == -1) {
      $('#quickemailalert').css('display', 'block');
      return false;
    }
    else {
      $('#quickemailalert').css('display', 'none');
    }
    if (subject == '') {
      $('#quicksubjectalert').css('display', 'block');
      return false;
    }
    else {
      $('#quicksubjectalert').css('display', 'none');
    }
    if (message == '') {
      $('#messagealert').css('display', 'block');
      return false;
    }
    else {
      $('#messagealert').css('display', 'none');
    }
    var description = 'Subject: '+subject;
    description += '&#013;&#010;';
    description += 'Message: '+message;
    var form = new FormData();
    form.append("grant_type", "client_credentials");
    form.append("client_id", "220df659-3f88-9184-7aae-64d0ca060409");
    form.append("client_secret", "ioDlA7#09yyM");
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://devl-crm.unblock.health/Api/access_token",
      "method": "POST",
      "headers": {
        "Accept": "application/vnd.api+json"
      },
      "processData": false,
      "contentType": false,
      "mimeType": "multipart/form-data",
      "data": form
    }
  
    $.ajax(settings).done(function (response) {
  
      var obj = $.parseJSON(response);
      var access_token = obj.access_token;
      var settings = {
        "url": "https://devl-crm.unblock.health/Api/V8/module",
        "method": "POST",
        "headers": {
          "Accept": "application/vnd.api+json",
          "Authorization": "Bearer " + access_token + "",
          "Content-Type": "application/json"
        },
        "processData": false,
        "data": "{\r\n  \"data\": {\r\n    \"type\": \"Contacts\",\r\n    \"id\": \"" + uid + "\",\r\n    \"attributes\": {\r\n     \"first_name\":\"" + first_name + "\",\r\n     \"email1\":\"" + email + "\"\r\n,\r\n     \"lead_source\":\"Web Site\"\r\n,\r\n     \"title\":\"GEN\"\r\n,\r\n     \"description\":\"" + description + "\"\r\n   }\r\n  }\r\n}\r\n"
      }
  
      $.ajax(settings).done(function (response) {
        //console.log(response);
        var contactid = response.data.id;
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": "https://devl-crm.unblock.health/Api/V8/module/Accounts/c548fc60-389f-8f5b-5ecb-64cce0924678/relationships",
          "method": "POST",
          "headers": {
            "Accept": "application/vnd.api+json",
            "Authorization": "Bearer " + access_token + "",
            "Content-Type": "application/json"
          },
          "processData": false,
          "data": "{  \r\n   \"data\":{  \r\n         \"type\":\"Contacts\",\r\n         \"id\":\"" + contactid + "\"\r\n\t    \r\n      }\r\n}"
        }
  
        $.ajax(settings).done(function (response) {
          //console.log(response);
          if (response.meta.message != "") {
            $("#contactform").trigger("reset");
            var $success = $('#successfooter'); // get the reference of the div
            $success.show().html('Your Message was sent successfully');
          }
        });
      });
    });
  });

  $('#contact-submit').prop('disabled', 'disabled');
  $('#contact-submit').addClass('is-disabled');
  $('#contactform').on('blur keyup change', 'textarea,input', function (event) {
    validateForm('#contactform', '#contact-submit');
  });
// patient impact story form

  $('#patient_impact_story_form').on('blur keyup change', 'textarea,input,select', function (event) {

    var comunityValidation = validateForm('#patient_impact_story_form', '#patient-story-form-submit');
    if ((comunityValidation == true) && $('#agree_checkbox').prop("checked") == true && $("#patient_first_name").val().length > 0 && $("#patient_last_name").val().length > 0 && $("#patient_email").val().length > 0 )
      {
        $('#patient-story-form-submit').prop('disabled', false);
        $('#patient-story-form-submit').removeClass('is-disabled');
      }
  });

  $('#patient-story-form-submit').click(function (e) {
    e.preventDefault();
    if($(this).val() == 'Please wait..'){
      return false;
    }
    $(this).val('Please wait..');
    $(this).attr('disabled',true);
    var First_Name = $('#patient_first_name').val();
    var Last_Name = $('#patient_last_name').val();
    var Email_Address = $('#patient_email').val();
    var story_title = $('#story_title').val();
    var story_description =  $('#story_description').val();
    var authorization_granted = $('#agree_checkbox').prop("checked");
    
    
    var token= "7sTXwg4jeFampJVOa6YxTRBv";
  
      var jform = new FormData();
      jform.append('data',$('#imageInput').get(0).files[0]); // Here's the important bit
       //console.log($('#imageInput').get(0).files[0]);
       //return false;
      $.ajax({
          url: 'https://test.admin.web.unblock.health/directus/files',
          type: 'POST',
          data: jform,
          dataType: 'json',
          mimeType: 'multipart/form-data', // this too
          contentType: false,
          cache: false,
          processData: false,
          headers: {
            "Authorization": "bearer "+ token,
            
          },
          success: function(data, status, jqXHR){
            // console.log(data);
            
            var photo = data.data.id;      
            var full_url =   data.data.data.full_url;      
          
            var settings = {
              "async": true,
              "crossDomain": true,
              //"url": "https://test.admin.app.unblock.health/ubhweb/items/himss20_contact_details",
              "url": "https://test.admin.web.unblock.health/directus/items/patient_stories",
              "method": "POST",
              "headers": {
                "Content-Type": "application/json",
                "Authorization": "bearer "+ token,
              },
              "processData": false,
          
              "data": "{\"status\": \"published\", \"first_name\": \"" + First_Name + "\" , \"last_name\" : \"" + Last_Name + "\" , \"email_id\": \"" + Email_Address + "\", \"story_title\": \"" + story_title + "\", \"story_description\": \"" + story_description + "\", \"photo\": " + photo + ", \"authorization_granted\": " + photo + "   \r\n       } \r\n\r\n"
            }
            $.ajax(settings).done(function (response) {
              $("#patient_impact_story_form").trigger("reset");
              sendm(token,Email_Address,First_Name,Last_Name,story_title,story_description,full_url);
  
              var $success = $('#patient_impact_story_success'); // get the reference of the div
                $success.show().html('Your Story was sent successfully');
                $('#patient-story-form-submit').val('Submit Your Story');
                $('#patient-story-form-submit').attr('disabled',false);
            });
      
          },
          error: function(jqXHR,status,error){
              // Hopefully we should never reach here
              var $success = $('#patient-story_error'); // get the reference of the div
                $success.show().html('Sorry, The story was not able to sent, please check all fields are provided.');
                $('#patient-story-form-submit').attr('disabled',false);
          }
      });
    
   
  });

  function sendm(token,to,First_Name,Last_Name,story_title,story_description,full_url){
    var subject = 'Unblock Health - Story Submitted';
    var to = ["mary.john@netspective.org","enlighteningresults@gmail.com"];
    //var to = ["rejina.kp@citrusinformatics.com"];
    
    var body = "";
    body += " <div  style='text-align: left;' trbidi='on'>";
    body += "<br />";
    body += "HI ,<br />";
    body += "<br />";
    body += First_Name + " " + Last_Name +" added new story with the following details.<br />";
    body += "<br />";
    body += "<b>First Name:</b>&nbsp;"+ First_Name + "<br />";
    body += "<br />";
    body += "<b>Last Name:</b>&nbsp;"+ Last_Name +"<br />";
    body += "<br />";
    body += "<b>Story Title:</b>&nbsp;"+ story_title +"<br />";
    body += "<br />";
    body += "<div width:250px;><b>Story Description:</b>&nbsp;"+story_description +"</div><br/>";
    body += "</br> <div class='separator' style='clear: both; text-align: center;'>";
    body += "<b> Photo:</b>&nbsp;<a href='"+ full_url +"' style='margin-left: 3px; margin-right: 3px; text-decoration: underline;'>";
    body += "</br>View Image";
    // body += "<img border='0' data-original-height='1000' data-original-width='1500' height='425' src='"+ full_url +"' width='640' />";
    body += "</a>";
    body += "</div>";
    body += "<br /></div>";
    body += "  </div>";
    
    var settings = {
      "async": true,
      "crossDomain": true,
      //"url": "https://test.admin.app.unblock.health/ubhweb/items/himss20_contact_details",
      "url": "https://test.admin.web.unblock.health/directus/mail",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "bearer "+ token,
      },
      "processData": false,
      "data": JSON.stringify({"to": to, "subject": subject , "body" :  body })
    }
    $.ajax(settings).done(function (response) {
      // console.log(response);
    });
  } 

 // Clear event
 $('.image-clear-btn').click(function(e){
  e.preventDefault();
  $(".myPopover").find("img").remove();
  $(".myPopover").toggleClass("slds-hide");
  $('.image-preview-filename').html("Add Your Photo*");
  $(".image-clear-btn").addClass("slds-hide");
  $(".image-clear-btn").removeClass("slds-show");
  $('.image-preview-input input:file').html("");
  $(".image-preview-input-title").text("Browse"); 
});

// Create the preview image
$(".image-preview-input input:file").change(function (){   
  $(".myPopover").find("img").remove();  
  var img = $('<img/>', {
      id: 'dynamic',
      width:250,
      height:200
  });      
  var file = this.files[0];
  var reader = new FileReader();
  // Set preview image into the popover data-content
  reader.onload = function (e) {
      $(".image-preview-input-title").text("Change");
      $(".image-clear-btn").removeClass("slds-hide");
      $(".image-clear-btn").addClass("slds-show");
      $(".image-preview-filename").html(file.name);
      // console.log(file.name);            
      img.attr('src', e.target.result);
      $(".myPopover").removeClass("slds-hide").append($(img)[0].outerHTML);
      //console.log($("#myPopover p").attr("data-content",$(img)[0].outerHTML));
  }        
  reader.readAsDataURL(file);
});  

$(document).on('click', '#close-preview', function(e){ 
  e.preventDefault();
  $(".myPopover").addClass("slds-hide");
  // Hover befor close the preview
  // $('.myPopover').hover(
  //     function () {
  //       $(".myPopover").removeClass("slds-hide");
  //     }, 
  //      function () {
  //       $(".myPopover").addClass("slds-hide");
  //     }
  // );    
});

  $('#story_description').keyup(function() {
    
    var characterCount = $(this).val().length,
        current = $('#current'),
        maximum = $('#maximum'),
        theCount = $('#the-count');
      
    current.text(characterCount);
   
    
    /*This isn't entirely necessary, just playin around*/
    
    
    if (characterCount >= 500) {
      maximum.css('color', '#8f0001');
      current.css('color', '#8f0001');
      theCount.css('font-weight','bold');
    } else {
      maximum.css('color','#666');
      theCount.css('font-weight','normal');
    }
    
        
  });
  
  $('#register-patient-advocate').click(function () {
    $('#patientoption').val('PA').trigger('change');
  })
  $('#register-hospital-him').click(function () {
    $('#patientoption').val('HIM').trigger('change');
  })
  
  function validateForm(id, buttonId, survey_category = "PA") {
    var valid = $(id).validate().checkForm();
    if (valid &&  survey_category != null ) {
      $(buttonId).prop('disabled', false);
      $(buttonId).removeClass('is-disabled');
      return true;
    } else {
      $(buttonId).prop('disabled', 'disabled');
      $(buttonId).addClass('is-disabled');
      return false;
    }
  }

  
});