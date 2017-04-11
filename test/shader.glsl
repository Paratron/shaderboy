precision highp float;

uniform sampler2D image;
uniform sampler2D texture0;
uniform sampler2D texture1;
uniform float time;
varying vec2 pixelCoords;

mat4 rotationMatrix(vec3 axis, float angle)
{
	axis = normalize(axis);
	float s = sin(angle);
	float c = cos(angle);
	float oc = 1.0 - c;

	return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
				oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
				oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
				0.0,                                0.0,                                0.0,                                1.0);
}


void main() {
	mat4 rot = rotationMatrix(vec3(1.0,1.0,1.0), 1.0472);
	vec4 uv = vec4(pixelCoords.xy, 1.0, 1.0);
	vec4 uvRot = uv * rot;

	vec4 map = texture2D(texture0, pixelCoords);
	float distortion  = (sin(uvRot.x*50.0+time)*0.005);
	float distortion2 = (sin(uvRot.y*42.0+time)*0.005);

	vec4 dist = vec4(distortion, distortion2, 1.0, 1.0);

	float xPos = (uv.x+dist.y);
	float yPos = (uv.y+dist.x);

	gl_FragColor = texture2D( texture1, vec2(xPos,yPos));
	if(map.r < 0.2){
		gl_FragColor = texture2D(image, pixelCoords);
	}
}