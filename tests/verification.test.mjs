import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionImpact} from '../js/impact.js';
test('impact uses only actual collected claims and their completion month',()=>{
 const now=+new Date(2026,9,15),thisMonth=+new Date(2026,9,2),lastMonth=+new Date(2026,8,30);
 const result=collectionImpact([{claimStatus:'collected',requestedBoxes:3,updatedAt:thisMonth},{claimStatus:'collected',requestedBoxes:7,updatedAt:lastMonth},{claimStatus:'enRoute',requestedBoxes:100,updatedAt:thisMonth},{claimStatus:'claimed',requestedBoxes:50,updatedAt:thisMonth}],now);
 assert.equal(result.boxesThisMonth,3);assert.equal(result.completed,2);assert.equal(result.months.at(-2).boxes,7);assert.equal(result.months.length,6);assert.equal(collectionImpact([],now).boxesThisMonth,0);
});

import {safeOrganizationImage} from '../js/organizations.js';
test('organization photos accept Google or the owner profile bucket path',()=>{
 const image='https://firebasestorage.googleapis.com/v0/b/meal-f9e82.firebasestorage.app/o/profile-images%2Fhostel%2Freview.png?alt=media&token=test';
 assert.equal(safeOrganizationImage(image,'hostel'),image);assert.equal(safeOrganizationImage(image,'ngo'),'');assert.equal(safeOrganizationImage(image.replace('https:','http:'),'hostel'),'');assert.equal(safeOrganizationImage('javascript:alert(1)','hostel'),'');assert.equal(safeOrganizationImage(image.replace('meal-f9e82','other-project'),'hostel'),'');
});
