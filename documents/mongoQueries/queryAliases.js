var text = ' ????? ?? ????? ';
db.getCollection('persons').aggregate( [ 
    { 
        $match: {
            $expr: {
                $regexMatch: { 
                    input: text, 
                    regex: {
                        $concat: [
                            //'\\s[?|?|?|?]*'
                            ' ',
                            $reduce : {
                                input: '$aliases',
                                initialValue: '',
                                in: {
                                    $concat: [
                                        '$$value',
                                        {'$cond': [{'$eq': ['$$value', '']}, '', '|']}, 
                                        '$$this'
                                    ]
                                }
                            },
                            '\\s'
                        ]
                            
//                         $concat: [ 
//                             '\\s[?|?|?|?]*', 
//                             '$name', 
//                             '\\s' 
//                         ] 
                    } 
                }
            } 
        } 
    }, 
    { $project: { name: 1 } } 
] )