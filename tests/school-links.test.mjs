import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolLink} from '../src/school-links.mjs';
test('学校跳转只允许HTTP(S)，拒绝脚本和网址中的账号密码',()=>{assert.equal(schoolLink('学校官网','https://www.nnu.edu.cn').url,'https://www.nnu.edu.cn/');for(const url of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.com'])assert.throws(()=>schoolLink('网站',url));assert.throws(()=>schoolLink('','https://example.com'));});
