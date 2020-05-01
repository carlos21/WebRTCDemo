import React from "react"

export default (props) => (
  <div
    key={`body`}
    id="___gatsby"
    dangerouslySetInnerHTML={{ __html: props.body }}
  />
)
