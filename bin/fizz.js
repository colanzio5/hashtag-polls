//Create Generic Zero Indexed Array
Array.from(Array(100).keys())
    //Add One to Each Element => [0...99] => [1...100]
    .map(element => {
        return element+1
    })
    //Implementation of FizzBuzz
    .map((element) => { 
        if((element%3 == 0) && (element%5 == 0)){ return "FizzBuzz"; }
        if((element%3 == 0)){ return "Fizz"; }
        if((element%5 == 0)){ return "Buzz"; }
        return element;
    })
    //Log Elements
    .forEach((element) => {
         console.log(element); 
    });