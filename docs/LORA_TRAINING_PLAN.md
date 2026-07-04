# Rico gegen Berlin LoRA Training Plan

This project should first lock the characters visually before training any LoRA.

## Goal

Create repeatable cartoon characters for Rico gegen Berlin:

```text
Rico
Falk
Sami
Kralle
DJ Nebel
Sven Null
```

Do not train a LoRA from messy random generations. First create a clean reference dataset.

## Dataset targets

| Character | Target images | Priority |
| --- | ---: | --- |
| Rico | 40-60 | core |
| Falk | 40-60 | core |
| Sami | 25-40 | support |
| Kralle | 30-50 | core cat |
| DJ Nebel | 25-40 | club support |
| Sven Null | 25-40 | club support |

## Required image types per character

```text
front full body
side full body
back full body
three-quarter body
close-up face
expression sheet
prop sheet
2-4 story poses
2-4 location context shots
```

## Image rules

```text
single character clearly visible
same cartoon style
no speech bubbles
no readable text
no logos
no photorealism
no semi-realistic portrait look
simple readable silhouette
consistent outfit logic
consistent face logic
```

## Caption rule

Every image should contain the trigger token and the most important stable identifiers.

Example:

```text
rgbrico, young innocent village boy in Berlin, huge confused eyes, clean hoodie, white sneakers, oversized backpack, blue-lid Tupperware, Free-for-All Berlin Absurd Cartoon
```

## Do not train yet if

```text
Rico still changes age between images
Falk sometimes looks like a child or villain gangster
Kralle becomes humanoid or too cute
Sven Null looks like police
DJ Nebel looks like a cool superstar
images contain speech bubbles or fake text
style keeps drifting between realistic and cartoon
```

## First production target

Before training, generate and approve one character reference sheet per core figure.

Each reference sheet should include:

```text
neutral pose
front view
side view
back view
3 expressions
3 props
one simple action pose
one strict negative prompt
```

## Training order

```text
1. Rico
2. Falk
3. Kralle
4. Sami
5. Sven Null
6. DJ Nebel
```

Rico and Falk must be stable before full episode production starts.
