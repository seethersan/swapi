const people  = require('../api/people');

test("GET Request", () => {
    expect(people.find({
        pathParameters: {
            name: "Luke Skywalker"
        }
    }).name).toBe('Luke Skywalker');
})