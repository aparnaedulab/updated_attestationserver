var counter = 12;
var interval = setInterval(function() {
    counter--;
    // Display 'counter' wherever you want to display it.
  //  document.getElementById('timer') = counter;
    if(counter == 8 )
    {
      document.getElementById('message').innerText ='Welcome';
    }else if (counter == 6 )
    {
      document.getElementById('message').innerText ='to';
    }else if (counter == 4 )
    {
      document.getElementById('message').innerText ='online';
    }else if (counter == 2 )
    {
      document.getElementById('message').innerText ='Attestation';
    }else if (counter == 1 )
    {
      document.getElementById('message').innerText ='System';
    }
    if (counter == 0) {
        // Display a login box
        clearInterval(interval);
         window.location.href='http://etranscript.in/'
    }
}, 1000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIiXX0=
//# sourceURL=coffeescript