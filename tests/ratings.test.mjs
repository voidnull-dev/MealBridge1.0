import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRating,ratingSummary,ratingId} from '../js/ratings.js';
test('rating input validates all role categories, integer stars and bounded feedback',()=>{
 const input={overallRating:5,feedback:' Good food ',categoryRatings:{foodCondition:4,pickupExperience:5,forged:9}};
 assert.deepEqual(validateRating(input,'ngo'),{overallRating:5,feedback:'Good food',categoryRatings:{foodCondition:4,pickupExperience:5}});
 for(const patch of [{overallRating:0},{overallRating:6},{overallRating:2.5},{feedback:'a'.repeat(1001)},{categoryRatings:{foodCondition:5}}])assert.throws(()=>validateRating({...input,...patch},'ngo'));
 assert.throws(()=>validateRating(input,'admin'));assert.throws(()=>validateRating(input,'hostel'));
 assert.equal(validateRating({overallRating:'4',categoryRatings:{pickupPunctuality:3,communication:4}},'hostel').overallRating,4);
});
test('provider scores aggregate only actual reviews with New Partner empty state',()=>{
 assert.equal(ratingSummary([]).label,'No ratings received yet.');assert.equal(ratingSummary([{overallRating:5},{overallRating:4}]).label,'4.5 / 5 · 2 reviews');assert.equal(ratingSummary([{overallRating:3}]).count,1);assert.equal(ratingId('ngo','ngo_food'),'ngo_ngo_food');
});
