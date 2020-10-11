db.references.aggregate([
    {
        $group:
        {
            _id: { $concat : ['[', { $substr: [ '$from', 0, 1] }, '] -> [', '$type', '] -> [', { $substr: [ '$to', 0, 1] }, ']' ] },
            count: { $sum: 1 }
        }
    },
    {
        // $project operator filter the fields to be displayed
        $project:
        {
            _id : 1, count: 1
        }
    }
])