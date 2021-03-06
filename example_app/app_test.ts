import members from "../tests/members.ts";
import server from "./app_server.ts";
server.run({ address: "localhost:1667" });

members.test("HomeResource", async () => {
  let response;

  response = await members.fetch.get("http://localhost:1667");
  members.assert.equals(await response.text(), '"GET request received!"');

  response = await members.fetch.get("http://localhost:1667/home");
  members.assert.equals(await response.text(), '"GET request received!"');

  response = await members.fetch.get("http://localhost:1667/home/");
  members.assert.equals(await response.text(), '"GET request received!"');

  response = await members.fetch.get("http://localhost:1667/home//");
  members.assert.equals(await response.text(), '"Not Found"');

  response = await members.fetch.post("http://localhost:1667");
  members.assert.equals(await response.text(), '"POST request received!"');

  response = await members.fetch.put("http://localhost:1667");
  members.assert.equals(await response.text(), '"PUT request received!"');

  response = await members.fetch.delete("http://localhost:1667");
  members.assert.equals(await response.text(), '"DELETE request received!"');

  response = await members.fetch.patch("http://localhost:1667");
  members.assert.equals(await response.text(), '"Method Not Allowed"');
  
});

members.test("UsersResource", async () => {
  let response;

  response = await members.fetch.get("http://localhost:1667/users");
  members.assert.equals(await response.text(), '"Please specify a user ID."');

  response = await members.fetch.get("http://localhost:1667/users/");
  members.assert.equals(await response.text(), '"Please specify a user ID."');

  response = await members.fetch.get("http://localhost:1667/users//");
  members.assert.equals(await response.text(), '"Not Found"');

  response = await members.fetch.get("http://localhost:1667/users/17");
  members.assert.equals(await response.text(), '{"id":17,"name":"Thor"}');

  response = await members.fetch.get("http://localhost:1667/users/17/");
  members.assert.equals(await response.text(), '{"id":17,"name":"Thor"}');

  response = await members.fetch.get("http://localhost:1667/users/18");
  members.assert.equals(
    await response.text(),
    `\"User with ID \\\"18\\\" not found.\"`
  );
});

members.test("CoffeeResource", async () => {
  let response;

  response = await members.fetch.get("http://localhost:1667/coffee", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '"Please specify a coffee ID."');

  response = await members.fetch.get("http://localhost:1667/coffee/", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '"Please specify a coffee ID."');

  response = await members.fetch.get("http://localhost:1667/coffee//", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '"Not Found"');

  response = await members.fetch.get("http://localhost:1667/coffee/17", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Light"}');

  response = await members.fetch.get("http://localhost:1667/coffee/17/", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Light"}');

  response = await members.fetch.get("http://localhost:1667/coffee/18", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Medium"}');

  response = await members.fetch.get("http://localhost:1667/coffee/18/", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Medium"}');

  response = await members.fetch.get("http://localhost:1667/coffee/19", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Dark"}');

  response = await members.fetch.get("http://localhost:1667/coffee/19/", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '{"name":"Dark"}');

  response = await members.fetch.get("http://localhost:1667/coffee/20", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(
    await response.text(),
    `\"Coffee with ID \\\"20\\\" not found.\"`
  );

  response = await members.fetch.post("http://localhost:1667/coffee/17/", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });
  members.assert.equals(await response.text(), '"Method Not Allowed"');

  let data;

  data = { id: 18 };
  response = await members.fetch.get(
    "http://localhost:1667/coffee/19?location=from_body",
    {
      headers: {
        "Content-Type": "application/json",
        "Content-Length": JSON.stringify(data).length
      },
      body: data
    }
  );
  members.assert.equals(await response.text(), '{"name":"Medium"}');

  // TODO(crookse) application/x-www-form-urlencoded works, but this test keeps failing. Fix.
  // data = { id: 18 };
  // response = await members.fetch.get("http://localhost:1667/coffee/19/?location=from_body", {
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  //     "Content-Length": JSON.stringify(data).length
  //   },
  //   body: JSON.stringify(data)
  // });
  // members.assert.equals(await response.text(), "{\"name\":\"Medium\"}");
});

members.test("CookieResource", async () => {
  let response;
  let cookies;
  let cookieName;
  let cookieVal;

  const cookie = { name: 'testCookie', value: 'Drash' }

  // Post
  response = await members.fetch.post("http://localhost:1667/cookie", {
    headers: {
      "Content-Type": "application/json"
    },
    body: cookie
  });
  members.assert.equals(await response.text(), "\"Saved your cookie!\"")

  // Get - Dependent on the above post request saving a cookie
  response = await members.fetch.get("http://localhost:1667/cookie", {
    credentials: 'same-origin',
    headers: {
      'Cookie': 'testCookie=Drash'
    }
  });
  members.assert.equals(await response.text(), "\"Drash\"")

  // Remove - Dependent on the above post request saving a cookie
  response = await members.fetch.delete("http://localhost:1667/cookie", {
    method: 'DELETE'
  });
  cookies = response.headers.get('set-cookie') || ''
  cookieName = cookies.split(';')[0].split('=')[0]
  cookieVal = cookies.split(';')[0].split('=')[1]
  members.assert.equals(cookieVal, '')
  
})

// members.test("FilesResource", async () => {
//   let response;

//   const file = new TextDecoder().decode(await Deno.readAll(await Deno.open("./file_1.txt")))
//   let formData = new FormData()
//   await formData.append(
//     "file_1",
//     file,
//     "file_1.txt"
//   );

//   console.log("file");

//   response = await members.fetch.post("http://localhost:1667/files", {
//     headers: {
//       "Content-Type": undefined,
//       // "Content-Type": "multipart/form-data; boundary=--------------------------434049563556637648550474",
//       "Content-Length": file.length
//     },
//     body: formData
//   });
//   members.assert.equals(await response.text(), '"Please specify a user ID."');
// });

await Deno.runTests();

server.close();
